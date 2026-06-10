import { getPublishedBookById } from "@/lib/books";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import {
  localAddToShelf,
  localGetShelfEntries,
  localGetShelfEntry,
  localRemoveFromShelf,
  localUpdateShelfStatus,
} from "@/lib/shelf/local";
import { enrichShelfEntries } from "@/lib/shelf/enrich";
import type { ShelfBook, ShelfEntry } from "@/lib/shelf/types";

function toShelfEntry(row: {
  id: string;
  bookId: string;
  status: string;
  rating: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  currentPage?: number | null;
  totalPages?: number | null;
  progressPercent?: number | null;
  lastReadAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ShelfEntry {
  return {
    id: row.id,
    bookId: row.bookId,
    status: row.status as ShelfEntry["status"],
    rating: row.rating,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    currentPage: row.currentPage ?? null,
    totalPages: row.totalPages ?? null,
    progressPercent: row.progressPercent ?? null,
    lastReadAt: row.lastReadAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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

export async function updateShelfStatus(
  userId: string,
  bookId: string,
  status: ShelfStatus,
) {
  if (!(await isDatabaseAvailable())) {
    const entry = await localUpdateShelfStatus(userId, bookId, status);
    return entry ? { entry } : { error: "Not on your shelf" as const };
  }

  try {
    const existing = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      return { error: "Not on your shelf" as const };
    }

    const now = new Date();
    const row = await prisma.userBook.update({
      where: { userId_bookId: { userId, bookId } },
      data: {
        status,
        startedAt:
          status === "CURRENTLY_READING" && !existing.startedAt
            ? now
            : undefined,
        finishedAt:
          (status === "READ" || status === "DNF") && !existing.finishedAt
            ? now
            : undefined,
      },
    });

    return { entry: toShelfEntry(row) };
  } catch {
    const entry = await localUpdateShelfStatus(userId, bookId, status);
    return entry ? { entry } : { error: "Not on your shelf" as const };
  }
}

export async function removeFromShelf(userId: string, bookId: string) {
  if (!(await isDatabaseAvailable())) {
    const removed = await localRemoveFromShelf(userId, bookId);
    return removed ? { success: true as const } : { error: "Not on your shelf" as const };
  }

  try {
    await prisma.userBook.delete({
      where: { userId_bookId: { userId, bookId } },
    });
    return { success: true as const };
  } catch {
    const removed = await localRemoveFromShelf(userId, bookId);
    return removed ? { success: true as const } : { error: "Not on your shelf" as const };
  }
}
