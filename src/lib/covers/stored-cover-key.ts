import { findLocalCoverKey } from "@/lib/covers/ensure-cover";
import { fileExists } from "@/lib/storage";
import { bookCoverKey } from "@/lib/storage/keys";

/** Resolve a stored cover path from DB metadata, local disk, or remote storage. */
export async function resolveStoredCoverKey(
  bookId: string,
  coverKey: string | null,
): Promise<string | null> {
  if (coverKey) {
    if (await fileExists(coverKey)) {
      return coverKey;
    }

    const local = findLocalCoverKey(bookId);
    if (local) {
      return local;
    }
  }

  const local = findLocalCoverKey(bookId);
  if (local) {
    return local;
  }

  for (const extension of ["jpg", "png", "webp"] as const) {
    const key = bookCoverKey(bookId, extension);
    if (await fileExists(key)) {
      return key;
    }
  }

  return coverKey;
}
