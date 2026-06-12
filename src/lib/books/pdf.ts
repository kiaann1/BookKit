import {
  getBookIdLookupCandidates,
  THE_ASCENDED_BOOK_ID,
} from "@/lib/books/paths";
import { BookStatus } from "@/lib/constants/book-status";
import { prisma } from "@/lib/db";
import { localFileExists } from "@/lib/storage/resolve";
import { blobObjectExists } from "@/lib/storage/blob";
import { bookPdfKey } from "@/lib/storage/keys";
import { isS3Configured, s3ObjectExists } from "@/lib/storage/s3";

/** Blob path from before the canonical Ascended id (still used in seed rows). */
const THE_ASCENDED_LEGACY_PDF_KEY =
  "books/the-ascended--grenwich-&-lennox/original.pdf";

const THE_ASCENDED_LEGACY_ID = "the-ascended--grenwich-&-lennox";

function canQueryDatabase() {
  return (
    Boolean(process.env.DATABASE_URL?.trim()) &&
    process.env.SKIP_DATABASE !== "true"
  );
}

function isUsablePdfKey(pdfKey: string | null | undefined) {
  return Boolean(pdfKey && pdfKey !== "pending" && pdfKey.trim().length > 0);
}

function fallbackKeysForCandidate(candidate: string) {
  const keys = [bookPdfKey(candidate)];

  if (
    candidate === THE_ASCENDED_BOOK_ID ||
    candidate === THE_ASCENDED_LEGACY_ID
  ) {
    keys.push(THE_ASCENDED_LEGACY_PDF_KEY);
  }

  return keys;
}

async function keyExistsOnRemoteBackend(key: string) {
  if (await blobObjectExists(key)) {
    return true;
  }

  return isS3Configured() && (await s3ObjectExists(key));
}

export async function getPublishedBookPdfKey(bookId: string) {
  const candidates = getBookIdLookupCandidates(bookId);
  const triedKeys = new Set<string>();
  const orderedKeys: string[] = [];

  for (const candidate of candidates) {
    for (const key of fallbackKeysForCandidate(candidate)) {
      if (!triedKeys.has(key)) {
        triedKeys.add(key);
        orderedKeys.push(key);
      }
    }
  }

  for (const key of orderedKeys) {
    if (localFileExists(key)) {
      return key;
    }
  }

  for (const key of orderedKeys) {
    if (await keyExistsOnRemoteBackend(key)) {
      return key;
    }
  }

  if (canQueryDatabase()) {
    for (const candidate of candidates) {
      try {
        const book = await prisma.book.findFirst({
          where: { id: candidate, status: BookStatus.PUBLISHED },
          select: { pdfKey: true },
        });

        if (!isUsablePdfKey(book?.pdfKey) || triedKeys.has(book!.pdfKey)) {
          continue;
        }

        triedKeys.add(book!.pdfKey);
        if (localFileExists(book!.pdfKey)) {
          return book!.pdfKey;
        }
        if (await keyExistsOnRemoteBackend(book!.pdfKey)) {
          return book!.pdfKey;
        }
      } catch (error) {
        console.error(
          "[pdf] Failed to resolve pdfKey from database:",
          candidate,
          error,
        );
      }
    }
  }

  return null;
}
