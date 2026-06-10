import { getCoverApiUrl } from "@/lib/storage";

/** Catalog lists use the cover API so images load lazily with stored + Open Library fallback. */
export function resolveBookListCoverUrl(bookId: string) {
  return getCoverApiUrl(bookId);
}

export function resolveBookCoverUrl(bookId: string) {
  return getCoverApiUrl(bookId);
}
