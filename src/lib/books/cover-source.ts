import { getStorageBookById } from "@/lib/books/storage-books";
import { BookStatus } from "@/lib/constants/book-status";
import { prisma } from "@/lib/db";

export type BookCoverSource = {
  id: string;
  title: string;
  author: string;
  coverKey: string | null;
};

function canQueryDatabase() {
  return (
    Boolean(process.env.DATABASE_URL?.trim()) &&
    process.env.SKIP_DATABASE !== "true"
  );
}

export async function getBookCoverSource(
  bookId: string,
): Promise<BookCoverSource | null> {
  const storageBook = await getStorageBookById(bookId);
  if (storageBook?.coverKey) {
    return {
      id: storageBook.id,
      title: storageBook.title,
      author: storageBook.author,
      coverKey: storageBook.coverKey,
    };
  }

  if (canQueryDatabase()) {
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
    } catch (error) {
      console.error("[covers] Failed to load book cover source:", bookId, error);
    }
  }

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
