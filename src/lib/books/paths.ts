/** Canonical id (no `&` — safe in URLs). Blob files may still use the legacy path. */
export const THE_ASCENDED_BOOK_ID = "the-ascended--grenwich-and-lennox";

/** Legacy ids / broken URL fragments → canonical book id. */
const LEGACY_BOOK_ID_ALIASES: Record<string, string> = {
  "the-ascended--grenwich-&-lennox": THE_ASCENDED_BOOK_ID,
  /** Unencoded `&` in URLs truncates the path at `&`. */
  "the-ascended--grenwich-": THE_ASCENDED_BOOK_ID,
};

export function resolveBookId(rawId: string) {
  const decoded = tryDecodeURIComponent(rawId);
  return LEGACY_BOOK_ID_ALIASES[decoded] ?? decoded;
}

/** All ids to try when loading a book (canonical, legacy DB ids, URL fragments). */
export function getBookIdLookupCandidates(rawId: string) {
  const decoded = tryDecodeURIComponent(rawId);
  const canonical = resolveBookId(decoded);
  const legacySources = Object.entries(LEGACY_BOOK_ID_ALIASES)
    .filter(([, target]) => target === canonical)
    .map(([source]) => source);

  return [...new Set([canonical, decoded, rawId, ...legacySources])];
}

function tryDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function catalogBookPath(bookId: string) {
  return `/catalog/${encodeURIComponent(bookId)}`;
}

export function readBookPath(bookId: string) {
  return `/read/${encodeURIComponent(bookId)}`;
}
