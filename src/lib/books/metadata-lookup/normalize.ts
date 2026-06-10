export const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "be",
  "in",
  "of",
  "the",
  "to",
]);

export function normalizeAuthor(author: string) {
  const trimmed = author.split(",")[0]?.trim() ?? author.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown author") {
    return "";
  }
  return trimmed;
}

export function normalizeTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ");
}

export function isMostlyNonLatin(text: string) {
  const latin = (text.match(/[a-z]/gi) ?? []).length;
  return latin < text.length * 0.3;
}

function namePartMatches(word: string, part: string) {
  if (word === part) {
    return true;
  }

  if (part.length < 3) {
    return false;
  }

  return word.startsWith(part) || part.startsWith(word);
}

export function authorMatchesHint(
  authorName: string,
  authorHint: string,
) {
  const hint = normalizeAuthor(authorHint).toLowerCase();
  if (!hint) {
    return false;
  }

  const name = authorName.toLowerCase();
  if (name === hint || name.includes(hint) || hint.includes(name)) {
    return true;
  }

  const hintParts = hint.split(/\s+/).filter(Boolean);
  const nameWords = name.split(/\s+/).filter(Boolean);

  if (hintParts.length === 1) {
    const [part] = hintParts;
    return nameWords.some((word) => namePartMatches(word, part));
  }

  const lastName = hintParts[hintParts.length - 1];
  const firstParts = hintParts.slice(0, -1);
  const lastNameMatches = nameWords.some((word) =>
    namePartMatches(word, lastName),
  );

  if (!lastNameMatches) {
    return false;
  }

  return firstParts.some((part) =>
    nameWords.some((word) => namePartMatches(word, part)),
  );
}

export function docKey(doc: {
  cover_i?: number;
  title?: string;
  author_name?: string[];
}) {
  return `${doc.cover_i ?? ""}:${normalizeTitle(doc.title ?? "")}:${(doc.author_name ?? []).join("|")}`;
}
