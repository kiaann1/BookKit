import {
  getBookIdLookupCandidates,
  THE_ASCENDED_BOOK_ID,
} from "@/lib/books/paths";
import { BookStatus } from "@/lib/constants/book-status";
import { prisma } from "@/lib/db";
import { fileExistsInAnyBackend } from "@/lib/storage/resolve";
import { bookPdfKey } from "@/lib/storage/keys";

/** Blob path from before the canonical Ascended id (still used in seed rows). */
const THE_ASCENDED_LEGACY_PDF_KEY =
  "books/the-ascended--grenwich-&-lennox/original.pdf";

function canQueryDatabase() {
  return (
    Boolean(process.env.DATABASE_URL?.trim()) &&
    process.env.SKIP_DATABASE !== "true"
  );
}

function isUsablePdfKey(pdfKey: string | null | undefined) {
  return Boolean(pdfKey && pdfKey !== "pending" && pdfKey.trim().length > 0);
}

async function firstExistingPdfKey(keys: string[]) {
  for (const key of keys) {
    if (await fileExistsInAnyBackend(key)) {
      return key;
    }
  }
  return null;
}

export async function getPublishedBookPdfKey(bookId: string) {
  const candidates = getBookIdLookupCandidates(bookId);
  const triedKeys = new Set<string>();

  for (const candidate of candidates) {
    const conventionalKey = bookPdfKey(candidate);
    const fallbackKeys = [conventionalKey];

    if (candidate === THE_ASCENDED_BOOK_ID) {
      fallbackKeys.push(THE_ASCENDED_LEGACY_PDF_KEY);
    }

    if (canQueryDatabase()) {
      try {
        const book = await prisma.book.findFirst({
          where: { id: candidate, status: BookStatus.PUBLISHED },
          select: { pdfKey: true },
        });

        if (isUsablePdfKey(book?.pdfKey) && !triedKeys.has(book!.pdfKey)) {
          triedKeys.add(book!.pdfKey);
          const fromDb = await firstExistingPdfKey([book!.pdfKey]);
          if (fromDb) {
            return fromDb;
          }
        }
      } catch (error) {
        console.error(
          "[pdf] Failed to resolve pdfKey from database:",
          candidate,
          error,
        );
      }
    }

    for (const key of fallbackKeys) {
      if (triedKeys.has(key)) {
        continue;
      }
      triedKeys.add(key);
      if (await fileExistsInAnyBackend(key)) {
        return key;
      }
    }
  }

  return null;
}
