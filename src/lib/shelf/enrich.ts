import { getPublishedBookById } from "@/lib/books";
import type { ShelfBook, ShelfEntry } from "@/lib/shelf/types";

export async function enrichShelfEntries(
  entries: ShelfEntry[],
): Promise<ShelfBook[]> {
  const books: ShelfBook[] = [];

  for (const entry of entries) {
    const book = await getPublishedBookById(entry.bookId);
    if (!book) {
      continue;
    }

    books.push({
      ...book,
      shelfEntryId: entry.id,
      shelfStatus: entry.status,
      rating: entry.rating,
      review: entry.review,
      startedAt: entry.startedAt,
      finishedAt: entry.finishedAt,
      currentPage: entry.currentPage,
      totalPages: entry.totalPages,
      progressPercent: entry.progressPercent,
      lastReadAt: entry.lastReadAt,
      showcaseOrder: entry.showcaseOrder,
      addedAt: entry.createdAt,
    });
  }

  return books;
}
