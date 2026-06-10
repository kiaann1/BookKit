import { prisma } from "@/lib/db";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

export async function generateUniqueUsername(
  firstName: string,
  lastName: string,
  email: string,
) {
  const bases = [
    slugify(`${firstName}${lastName}`),
    slugify(`${firstName}_${lastName}`),
    slugify(email.split("@")[0] ?? "reader"),
  ].filter((base) => base.length >= 3);

  const base = bases[0] ?? "reader";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : String(Math.floor(Math.random() * 9000) + 1000);
    const candidate = `${base}${suffix}`.slice(0, 30);
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  return `reader${Date.now().toString(36).slice(-8)}`;
}
