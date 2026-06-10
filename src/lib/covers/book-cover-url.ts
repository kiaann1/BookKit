import { resolveExternalCoverUrl } from "@/lib/covers/resolve";
import { getCoverUrl } from "@/lib/storage";

/** Fast path for catalog lists — only uses stored cover keys, no network. */
export function resolveBookListCoverUrl(options: {
  bookId: string;
  coverKey: string | null;
}) {
  if (!options.coverKey) {
    return null;
  }

  return getCoverUrl(options.bookId, options.coverKey);
}

export async function resolveBookCoverUrl(options: {
  bookId: string;
  title: string;
  author: string;
  coverKey: string | null;
}): Promise<string | null> {
  if (options.coverKey) {
    return getCoverUrl(options.bookId, options.coverKey);
  }

  return resolveExternalCoverUrl(options.title, options.author);
}
