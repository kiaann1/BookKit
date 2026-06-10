import { hasStoragePdf } from "@/lib/books/storage-books";
import { BookStatus } from "@/lib/constants/book-status";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { bookPdfKey } from "@/lib/storage/keys";

export async function getPublishedBookPdfKey(bookId: string) {
  if (hasStoragePdf(bookId)) {
    return bookPdfKey(bookId);
  }

  if (!(await isDatabaseAvailable())) {
    return null;
  }

  try {
    const book = await prisma.book.findFirst({
      where: { id: bookId, status: BookStatus.PUBLISHED },
      select: { pdfKey: true },
    });
    return book?.pdfKey ?? null;
  } catch {
    return hasStoragePdf(bookId) ? bookPdfKey(bookId) : null;
  }
}
