import { hasStoragePdf } from "@/lib/books/storage-books";
import { BookStatus } from "@/lib/constants/book-status";
import { prisma } from "@/lib/db";
import { fileExists } from "@/lib/storage";
import { bookPdfKey } from "@/lib/storage/keys";

function canQueryDatabase() {
  return (
    Boolean(process.env.DATABASE_URL?.trim()) &&
    process.env.SKIP_DATABASE !== "true"
  );
}

export async function getPublishedBookPdfKey(bookId: string) {
  const conventionalKey = bookPdfKey(bookId);

  if (hasStoragePdf(bookId)) {
    return conventionalKey;
  }

  if (canQueryDatabase()) {
    try {
      const book = await prisma.book.findFirst({
        where: { id: bookId, status: BookStatus.PUBLISHED },
        select: { pdfKey: true },
      });

      if (book?.pdfKey) {
        return book.pdfKey;
      }
    } catch (error) {
      console.error("[pdf] Failed to resolve pdfKey from database:", bookId, error);
    }
  }

  if (await fileExists(conventionalKey)) {
    return conventionalKey;
  }

  return null;
}
