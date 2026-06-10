import { resolveExternalCoverUrl } from "@/lib/covers/resolve";
import { getCoverUrl } from "@/lib/storage";

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
