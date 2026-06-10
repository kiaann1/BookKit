import { prisma } from "@/lib/db";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

export function buildUsernameCandidates(firstName: string, lastName: string) {
  const first = slugify(firstName);
  const last = slugify(lastName);
  const firstInitial = first.charAt(0);
  const lastInitial = last.charAt(0);

  const candidates = [
    first && last ? `${first}${last}` : null,
    first && last ? `${first}_${last}` : null,
    first && lastInitial ? `${first}${lastInitial}` : null,
    firstInitial && last ? `${firstInitial}${last}` : null,
    last && first ? `${last}${first}` : null,
    first ? `${first}reads` : null,
    first ? `reads${first}` : null,
    first ? `${first}books` : null,
    first ? `bookish${first}` : null,
    first && last ? `${first}_${lastInitial}` : null,
    first ? `${first}lit` : null,
    first && last
      ? `${first}${last}`.slice(0, 26) + lastInitial
      : null,
  ]
    .map((value) => (value ? normalizeUsername(value) : null))
    .filter((value): value is string => Boolean(value && value.length >= 3));

  return [...new Set(candidates)];
}

async function isUsernameAvailable(username: string, excludeUserId?: string) {
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!existing) {
    return true;
  }

  return Boolean(excludeUserId && existing.id === excludeUserId);
}

export async function buildAvailableUsernameSuggestions(
  firstName: string,
  lastName: string,
  excludeUserId?: string,
  limit = 6,
) {
  const available: string[] = [];

  for (const candidate of buildUsernameCandidates(firstName, lastName)) {
    if (await isUsernameAvailable(candidate, excludeUserId)) {
      available.push(candidate);
    }

    if (available.length >= limit) {
      return available;
    }
  }

  const base = slugify(`${firstName}${lastName}`) || slugify(firstName) || "reader";

  for (let attempt = 0; attempt < 40 && available.length < limit; attempt += 1) {
    const suffix =
      attempt === 0 ? "" : String(Math.floor(Math.random() * 9000) + 1000);
    const candidate = normalizeUsername(`${base}${suffix}`);

    if (
      candidate.length >= 3 &&
      !available.includes(candidate) &&
      (await isUsernameAvailable(candidate, excludeUserId))
    ) {
      available.push(candidate);
    }
  }

  return available;
}

export async function generateUniqueUsername(
  firstName: string,
  lastName: string,
  email: string,
) {
  const candidates = [
    ...buildUsernameCandidates(firstName, lastName),
    normalizeUsername(email.split("@")[0] ?? ""),
  ].filter((value) => value.length >= 3);

  for (const candidate of candidates) {
    if (await isUsernameAvailable(candidate)) {
      return candidate;
    }
  }

  const base = candidates[0] ?? "reader";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix =
      attempt === 0 ? "" : String(Math.floor(Math.random() * 9000) + 1000);
    const candidate = normalizeUsername(`${base}${suffix}`);

    if (await isUsernameAvailable(candidate)) {
      return candidate;
    }
  }

  return `reader${Date.now().toString(36).slice(-8)}`;
}
