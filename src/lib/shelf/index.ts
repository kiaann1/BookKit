import { getPublishedBookById } from "@/lib/books";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import { MAX_SHOWCASE_BOOKS } from "@/lib/constants/shelf";
import { isDatabaseAvailable } from "@/lib/db/health";
import { sanitizeOptionalPlainText } from "@/lib/security/sanitize";
import { prisma } from "@/lib/db";
import {
  localAddToShelf,
  localGetShelfEntries,
  localGetShelfEntry,
  localRemoveFromShelf,
  localSetShowcaseBooks,
  localUpdateShelfEntry,
} from "@/lib/shelf/local";
import { enrichShelfEntries } from "@/lib/shelf/enrich";
import { toShelfEntry } from "@/lib/shelf/map-entry";
import type { ShelfBook, ShelfEntry, ShelfUpdateInput } from "@/lib/shelf/types";

function applyStatusDates(
  status: ShelfStatus,
  existing: Pick<ShelfEntry, "startedAt" | "finishedAt">,
) {
  const now = new Date();
  return {
    startedAt:
      status === "CURRENTLY_READING" && !existing.startedAt ? now : undefined,
    finishedAt:
      (status === "READ" || status === "DNF") && !existing.finishedAt
        ? now
        : undefined,
  };
}

export async function getShelfEntry(userId: string, bookId: string) {
  if (!(await isDatabaseAvailable())) {
    return localGetShelfEntry(userId, bookId);
  }

  try {
    const row = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    return row ? toShelfEntry(row) : null;
  } catch {
    return localGetShelfEntry(userId, bookId);
  }
}

export async function getUserShelf(
  userId: string,
  status?: ShelfStatus,
): Promise<ShelfBook[]> {
  let entries: ShelfEntry[];

  if (!(await isDatabaseAvailable())) {
    entries = await localGetShelfEntries(userId);
  } else {
    try {
      const rows = await prisma.userBook.findMany({
        where: {
          userId,
          ...(status ? { status } : {}),
        },
        orderBy: { updatedAt: "desc" },
      });
      entries = rows.map(toShelfEntry);
    } catch {
      entries = await localGetShelfEntries(userId);
    }
  }

  if (status && !(await isDatabaseAvailable())) {
    entries = entries.filter((entry) => entry.status === status);
  }

  return enrichShelfEntries(entries);
}

export async function getShowcaseBooks(userId: string): Promise<ShelfBook[]> {
  let entries: ShelfEntry[];

  if (!(await isDatabaseAvailable())) {
    entries = (await localGetShelfEntries(userId))
      .filter((entry) => entry.showcaseOrder !== null)
      .sort((a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0));
  } else {
    try {
      const rows = await prisma.userBook.findMany({
        where: { userId, showcaseOrder: { not: null } },
        orderBy: { showcaseOrder: "asc" },
      });
      entries = rows.map(toShelfEntry);
    } catch {
      entries = (await localGetShelfEntries(userId))
        .filter((entry) => entry.showcaseOrder !== null)
        .sort((a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0));
    }
  }

  return enrichShelfEntries(entries);
}

export async function getShelfStatusCounts(userId: string) {
  const books = await getUserShelf(userId);
  const counts = books.reduce<Record<string, number>>((acc, book) => {
    acc[book.shelfStatus] = (acc[book.shelfStatus] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: books.length,
    counts,
  };
}

export async function addToShelf(
  userId: string,
  bookId: string,
  status: ShelfStatus,
) {
  const book = await getPublishedBookById(bookId);
  if (!book) {
    return { error: "Book not found" as const };
  }

  const existing = await getShelfEntry(userId, bookId);
  if (existing) {
    return { error: "Book is already on your shelf" as const };
  }

  if (!(await isDatabaseAvailable())) {
    const entry = await localAddToShelf(userId, bookId, status);
    return { entry };
  }

  try {
    const now = new Date();
    const row = await prisma.userBook.create({
      data: {
        userId,
        bookId,
        status,
        startedAt: status === "CURRENTLY_READING" ? now : undefined,
        finishedAt:
          status === "READ" || status === "DNF" ? now : undefined,
      },
    });
    return { entry: toShelfEntry(row) };
  } catch {
    const entry = await localAddToShelf(userId, bookId, status);
    return { entry };
  }
}

export async function updateShelfEntry(
  userId: string,
  bookId: string,
  input: ShelfUpdateInput,
) {
  if (!(await isDatabaseAvailable())) {
    const entry = await localUpdateShelfEntry(userId, bookId, input);
    return entry ? { entry } : { error: "Not on your shelf" as const };
  }

  try {
    const existing = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      return { error: "Not on your shelf" as const };
    }

    const statusDates = input.status
      ? applyStatusDates(input.status, existing)
      : {};

    const row = await prisma.userBook.update({
      where: { userId_bookId: { userId, bookId } },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.review !== undefined
          ? {
              review: sanitizeOptionalPlainText(input.review, {
                maxLength: 2000,
              }),
            }
          : {}),
        ...(input.startedAt !== undefined ? { startedAt: input.startedAt } : {}),
        ...(input.finishedAt !== undefined
          ? { finishedAt: input.finishedAt }
          : {}),
        ...statusDates,
      },
    });

    return { entry: toShelfEntry(row) };
  } catch {
    const entry = await localUpdateShelfEntry(userId, bookId, input);
    return entry ? { entry } : { error: "Not on your shelf" as const };
  }
}

/** @deprecated Use updateShelfEntry */
export async function updateShelfStatus(
  userId: string,
  bookId: string,
  status: ShelfStatus,
) {
  return updateShelfEntry(userId, bookId, { status });
}

export async function removeFromShelf(userId: string, bookId: string) {
  if (!(await isDatabaseAvailable())) {
    const removed = await localRemoveFromShelf(userId, bookId);
    return removed
      ? { success: true as const }
      : { error: "Not on your shelf" as const };
  }

  try {
    await prisma.userBook.delete({
      where: { userId_bookId: { userId, bookId } },
    });
    return { success: true as const };
  } catch {
    const removed = await localRemoveFromShelf(userId, bookId);
    return removed
      ? { success: true as const }
      : { error: "Not on your shelf" as const };
  }
}

export async function setShowcaseBooks(userId: string, bookIds: string[]) {
  if (bookIds.length > MAX_SHOWCASE_BOOKS) {
    return {
      error: `Showcase supports up to ${MAX_SHOWCASE_BOOKS} books` as const,
    };
  }

  const uniqueIds = [...new Set(bookIds)];
  if (uniqueIds.length !== bookIds.length) {
    return { error: "Duplicate books in showcase" as const };
  }

  const shelf = await getUserShelf(userId);
  const shelfIds = new Set(shelf.map((book) => book.id));

  for (const bookId of uniqueIds) {
    if (!shelfIds.has(bookId)) {
      return { error: "All showcase books must be on your shelf" as const };
    }
  }

  if (!(await isDatabaseAvailable())) {
    const books = await localSetShowcaseBooks(userId, uniqueIds);
    return { books };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userBook.updateMany({
        where: { userId },
        data: { showcaseOrder: null },
      });

      for (let index = 0; index < uniqueIds.length; index += 1) {
        await tx.userBook.update({
          where: {
            userId_bookId: { userId, bookId: uniqueIds[index] },
          },
          data: { showcaseOrder: index + 1 },
        });
      }
    });

    const books = await getShowcaseBooks(userId);
    return { books };
  } catch {
    const books = await localSetShowcaseBooks(userId, uniqueIds);
    return { books };
  }
}
