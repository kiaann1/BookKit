import { getPublishedBookById } from "@/lib/books";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { normalizeReadingProgress } from "@/lib/progress/normalize";
import type { ReadingProgress, SaveProgressInput } from "@/lib/progress/types";
import { ShelfStatus } from "@/lib/constants/shelf-status";
import {
  localAddToShelf,
  localGetShelfEntries,
  localGetShelfEntry,
} from "@/lib/shelf/local";
import { enrichShelfEntries } from "@/lib/shelf/enrich";
import { toShelfEntry } from "@/lib/shelf/map-entry";
import type { ShelfBook } from "@/lib/shelf/types";

function computePercent(currentPage: number, totalPages: number) {
  if (totalPages <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((currentPage / totalPages) * 1000) / 10);
}

async function localSaveProgress(
  userId: string,
  bookId: string,
  input: SaveProgressInput,
) {
  const { mkdir, writeFile } = await import("fs/promises");
  const path = await import("path");

  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(process.cwd(), "storage", "shelf", `${safeId}.json`);

  let entries = await localGetShelfEntries(userId);
  let entry = entries.find((item) => item.bookId === bookId);

  if (!entry) {
    entry = await localAddToShelf(userId, bookId, ShelfStatus.CURRENTLY_READING);
    entries = await localGetShelfEntries(userId);
    entry = entries.find((item) => item.bookId === bookId)!;
  } else if (entry.status === ShelfStatus.WANT_TO_READ) {
    entry.status = ShelfStatus.CURRENTLY_READING;
    if (!entry.startedAt) {
      entry.startedAt = new Date();
    }
  }

  const now = new Date();
  const progressPercent = computePercent(input.currentPage, input.totalPages);

  entry.currentPage = input.currentPage;
  entry.totalPages = input.totalPages;
  entry.progressPercent = progressPercent;
  entry.lastReadAt = now;
  entry.updatedAt = now;

  const nextEntries = entries.map((item) =>
    item.bookId === bookId ? entry! : item,
  );

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify({ entries: nextEntries }, null, 2),
    "utf-8",
  );

  return {
    currentPage: entry.currentPage,
    totalPages: entry.totalPages,
    progressPercent: entry.progressPercent,
    lastReadAt: entry.lastReadAt,
  } satisfies ReadingProgress;
}

function normalizeSaveInput(input: SaveProgressInput): SaveProgressInput {
  const totalPages = Math.max(1, input.totalPages);
  const currentPage = Math.min(Math.max(1, input.currentPage), totalPages);

  return { currentPage, totalPages };
}

export async function getReadingProgress(
  userId: string,
  bookId: string,
): Promise<ReadingProgress | null> {
  if (!(await isDatabaseAvailable())) {
    const entry = await localGetShelfEntry(userId, bookId);
    return normalizeReadingProgress(
      entry
        ? {
            currentPage: entry.currentPage ?? null,
            totalPages: entry.totalPages ?? null,
            progressPercent: entry.progressPercent ?? null,
            lastReadAt: entry.lastReadAt ?? null,
            updatedAt: entry.updatedAt,
          }
        : null,
    );
  }

  try {
    const row = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: {
        currentPage: true,
        totalPages: true,
        progressPercent: true,
        lastReadAt: true,
        updatedAt: true,
      },
    });

    return normalizeReadingProgress(row);
  } catch {
    const entry = await localGetShelfEntry(userId, bookId);
    return normalizeReadingProgress(
      entry
        ? {
            currentPage: entry.currentPage ?? null,
            totalPages: entry.totalPages ?? null,
            progressPercent: entry.progressPercent ?? null,
            lastReadAt: entry.lastReadAt ?? null,
            updatedAt: entry.updatedAt,
          }
        : null,
    );
  }
}

export async function getProgressForBooks(
  userId: string,
  bookIds: string[],
): Promise<Map<string, ReadingProgress>> {
  const uniqueIds = [...new Set(bookIds)];
  const progress = new Map<string, ReadingProgress>();

  if (uniqueIds.length === 0) {
    return progress;
  }

  if (!(await isDatabaseAvailable())) {
    const entries = await localGetShelfEntries(userId);
    for (const entry of entries) {
      if (!uniqueIds.includes(entry.bookId)) {
        continue;
      }

      const normalized = normalizeReadingProgress({
        currentPage: entry.currentPage ?? null,
        totalPages: entry.totalPages ?? null,
        progressPercent: entry.progressPercent ?? null,
        lastReadAt: entry.lastReadAt ?? null,
        updatedAt: entry.updatedAt,
      });

      if (normalized) {
        progress.set(entry.bookId, normalized);
      }
    }

    return progress;
  }

  try {
    const rows = await prisma.userBook.findMany({
      where: {
        userId,
        bookId: { in: uniqueIds },
      },
      select: {
        bookId: true,
        currentPage: true,
        totalPages: true,
        progressPercent: true,
        lastReadAt: true,
        updatedAt: true,
      },
    });

    for (const row of rows) {
      const normalized = normalizeReadingProgress(row);
      if (normalized) {
        progress.set(row.bookId, normalized);
      }
    }
  } catch {
    const entries = await localGetShelfEntries(userId);
    for (const entry of entries) {
      if (!uniqueIds.includes(entry.bookId)) {
        continue;
      }

      const normalized = normalizeReadingProgress({
        currentPage: entry.currentPage ?? null,
        totalPages: entry.totalPages ?? null,
        progressPercent: entry.progressPercent ?? null,
        lastReadAt: entry.lastReadAt ?? null,
        updatedAt: entry.updatedAt,
      });

      if (normalized) {
        progress.set(entry.bookId, normalized);
      }
    }
  }

  return progress;
}

export async function saveReadingProgress(
  userId: string,
  bookId: string,
  input: SaveProgressInput,
) {
  const book = await getPublishedBookById(bookId);
  if (!book) {
    return { error: "Book not found" as const };
  }

  const normalized = normalizeSaveInput(input);
  const progressPercent = computePercent(
    normalized.currentPage,
    normalized.totalPages,
  );
  const now = new Date();

  if (!(await isDatabaseAvailable())) {
    const progress = await localSaveProgress(userId, bookId, normalized);
    return { progress };
  }

  try {
    const existing = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!existing) {
      await prisma.userBook.create({
        data: {
          userId,
          bookId,
          status: ShelfStatus.CURRENTLY_READING,
          startedAt: now,
          currentPage: normalized.currentPage,
          totalPages: normalized.totalPages,
          progressPercent,
          lastReadAt: now,
        },
      });
    } else {
      await prisma.userBook.update({
        where: { userId_bookId: { userId, bookId } },
        data: {
          currentPage: normalized.currentPage,
          totalPages: normalized.totalPages,
          progressPercent,
          lastReadAt: now,
          ...(existing.status === ShelfStatus.WANT_TO_READ
            ? { status: ShelfStatus.CURRENTLY_READING, startedAt: now }
            : {}),
        },
      });
    }

    return {
      progress: {
        currentPage: normalized.currentPage,
        totalPages: normalized.totalPages,
        progressPercent,
        lastReadAt: now,
      } satisfies ReadingProgress,
    };
  } catch {
    const progress = await localSaveProgress(userId, bookId, normalized);
    return { progress };
  }
}

export async function getContinueReading(
  userId: string,
): Promise<ShelfBook | null> {
  let entries = await localGetShelfEntries(userId);

  if (await isDatabaseAvailable()) {
    try {
      const rows = await prisma.userBook.findMany({
        where: {
          userId,
          OR: [
            { status: ShelfStatus.CURRENTLY_READING },
            { lastReadAt: { not: null } },
          ],
        },
        orderBy: { lastReadAt: "desc" },
      });
      entries = rows.map(toShelfEntry);
    } catch {
      entries = await localGetShelfEntries(userId);
    }
  }

  const candidate = entries
    .filter(
      (entry) =>
        entry.lastReadAt &&
        entry.status !== ShelfStatus.READ &&
        (entry.progressPercent === null || entry.progressPercent < 100),
    )
    .sort(
      (a, b) =>
        (b.lastReadAt?.getTime() ?? 0) - (a.lastReadAt?.getTime() ?? 0),
    )[0];

  if (!candidate) {
    const inProgress = entries.find(
      (entry) => entry.status === ShelfStatus.CURRENTLY_READING,
    );
    if (!inProgress) {
      return null;
    }
    const books = await enrichShelfEntries([inProgress]);
    return books[0] ?? null;
  }

  const books = await enrichShelfEntries([candidate]);
  return books[0] ?? null;
}
