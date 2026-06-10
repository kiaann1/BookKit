import { getStorageBookById } from "@/lib/books/storage-books";
import { BookStatus } from "@/lib/constants/book-status";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";

export type BookCoverSource = {
  id: string;
  title: string;
  author: string;
  coverKey: string | null;
};

export async function getBookCoverSource(
  bookId: string,
): Promise<BookCoverSource | null> {
  if (await isDatabaseAvailable()) {
    try {
      const book = await prisma.book.findFirst({
        where: {
          id: bookId,
          status: {
            in: [BookStatus.PUBLISHED, BookStatus.DRAFT, BookStatus.ARCHIVED],
          },
        },
        select: {
          id: true,
          title: true,
          author: true,
          coverKey: true,
        },
      });

      if (book) {
        return book;
      }
    } catch {
      // Fall through to storage.
    }
  }

  const storageBook = await getStorageBookById(bookId);
  if (storageBook) {
    return {
      id: storageBook.id,
      title: storageBook.title,
      author: storageBook.author,
      coverKey: storageBook.coverKey,
    };
  }

  return null;
}
