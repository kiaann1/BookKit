import { ONBOARDING_GENRE_GROUPS } from "@/lib/constants/genres";

const FICTION_GENRES = new Set<string>(ONBOARDING_GENRE_GROUPS[0].genres);
const NON_FICTION_GENRES = new Set<string>(ONBOARDING_GENRE_GROUPS[1].genres);

function preferenceGroup(preference: string) {
  if (FICTION_GENRES.has(preference)) {
    return "fiction" as const;
  }

  if (NON_FICTION_GENRES.has(preference)) {
    return "non-fiction" as const;
  }

  if (preference === "Fiction") {
    return "fiction" as const;
  }

  if (preference === "Non-Fiction") {
    return "non-fiction" as const;
  }

  return null;
}

function bookGroups(bookGenres: string[]) {
  const groups = new Set<"fiction" | "non-fiction">();

  for (const genre of bookGenres) {
    if (genre === "Fiction" || FICTION_GENRES.has(genre)) {
      groups.add("fiction");
    }

    if (genre === "Non-Fiction" || NON_FICTION_GENRES.has(genre)) {
      groups.add("non-fiction");
    }
  }

  return groups;
}

/** Direct tag overlap plus broad Fiction / Non-Fiction category matches. */
export function matchingGenres(bookGenres: string[], preferences: string[]) {
  if (preferences.length === 0) {
    return [];
  }

  const preferenceSet = new Set(preferences);
  const direct = bookGenres.filter((genre) => preferenceSet.has(genre));
  if (direct.length > 0) {
    return direct;
  }

  const specificBookGenres = bookGenres.filter(
    (genre) => genre !== "Fiction" && genre !== "Non-Fiction",
  );
  if (specificBookGenres.length > 0) {
    return [];
  }

  const groups = bookGroups(bookGenres);
  const matchedPreferences: string[] = [];

  for (const preference of preferences) {
    const group = preferenceGroup(preference);
    if (group && groups.has(group)) {
      matchedPreferences.push(preference);
    }
  }

  return matchedPreferences;
}
