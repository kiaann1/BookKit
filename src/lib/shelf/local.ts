import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import type { ShelfEntry, ShelfUpdateInput } from "@/lib/shelf/types";
import { enrichShelfEntries } from "@/lib/shelf/enrich";

type LocalShelfFile = {
  entries: ShelfEntry[];
};

function shelfPath(userId: string) {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(process.cwd(), "storage", "shelf", `${safeId}.json`);
}

function normalizeEntry(entry: ShelfEntry): ShelfEntry {
  return {
    ...entry,
    review: entry.review ?? null,
    showcaseOrder: entry.showcaseOrder ?? null,
    currentPage: entry.currentPage ?? null,
    totalPages: entry.totalPages ?? null,
    progressPercent: entry.progressPercent ?? null,
    lastReadAt: entry.lastReadAt ? new Date(entry.lastReadAt) : null,
    startedAt: entry.startedAt ? new Date(entry.startedAt) : null,
    finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  };
}

async function readShelf(userId: string): Promise<LocalShelfFile> {
  try {
    const raw = await readFile(shelfPath(userId), "utf-8");
    const parsed = JSON.parse(raw) as LocalShelfFile;
    return {
      entries: parsed.entries.map(normalizeEntry),
    };
  } catch {
    return { entries: [] };
  }
}

async function writeShelf(userId: string, data: LocalShelfFile) {
  const filePath = shelfPath(userId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function localGetShelfEntries(userId: string) {
  const shelf = await readShelf(userId);
  return shelf.entries;
}

export async function localGetShelfEntry(userId: string, bookId: string) {
  const entries = await localGetShelfEntries(userId);
  return entries.find((entry) => entry.bookId === bookId) ?? null;
}

export async function localAddToShelf(
  userId: string,
  bookId: string,
  status: ShelfStatus,
) {
  const shelf = await readShelf(userId);
  const existing = shelf.entries.find((entry) => entry.bookId === bookId);
  if (existing) {
    return existing;
  }

  const now = new Date();
  const entry: ShelfEntry = {
    id: `local-${bookId}`,
    bookId,
    status,
    rating: null,
    review: null,
    startedAt: status === "CURRENTLY_READING" ? now : null,
    finishedAt: status === "READ" || status === "DNF" ? now : null,
    currentPage: null,
    totalPages: null,
    progressPercent: null,
    lastReadAt: null,
    showcaseOrder: null,
    createdAt: now,
    updatedAt: now,
  };

  shelf.entries.unshift(entry);
  await writeShelf(userId, shelf);
  return entry;
}

export async function localUpdateShelfEntry(
  userId: string,
  bookId: string,
  input: ShelfUpdateInput,
) {
  const shelf = await readShelf(userId);
  const index = shelf.entries.findIndex((entry) => entry.bookId === bookId);
  if (index === -1) {
    return null;
  }

  const now = new Date();
  const entry = shelf.entries[index];

  if (input.status) {
    if (input.status === "CURRENTLY_READING" && !entry.startedAt) {
      entry.startedAt = now;
    }
    if (
      (input.status === "READ" || input.status === "DNF") &&
      !entry.finishedAt
    ) {
      entry.finishedAt = now;
    }
    entry.status = input.status;
  }

  if (input.rating !== undefined) {
    entry.rating = input.rating;
  }
  if (input.review !== undefined) {
    entry.review = input.review;
  }
  if (input.startedAt !== undefined) {
    entry.startedAt = input.startedAt;
  }
  if (input.finishedAt !== undefined) {
    entry.finishedAt = input.finishedAt;
  }

  entry.updatedAt = now;
  shelf.entries[index] = entry;
  await writeShelf(userId, shelf);
  return entry;
}

/** @deprecated Use localUpdateShelfEntry */
export async function localUpdateShelfStatus(
  userId: string,
  bookId: string,
  status: ShelfStatus,
) {
  return localUpdateShelfEntry(userId, bookId, { status });
}

export async function localRemoveFromShelf(userId: string, bookId: string) {
  const shelf = await readShelf(userId);
  const next = shelf.entries.filter((entry) => entry.bookId !== bookId);
  if (next.length === shelf.entries.length) {
    return false;
  }
  await writeShelf(userId, { entries: next });
  return true;
}

export async function localSetShowcaseBooks(userId: string, bookIds: string[]) {
  const shelf = await readShelf(userId);

  for (const entry of shelf.entries) {
    entry.showcaseOrder = null;
  }

  for (let index = 0; index < bookIds.length; index += 1) {
    const entry = shelf.entries.find((row) => row.bookId === bookIds[index]);
    if (entry) {
      entry.showcaseOrder = index + 1;
      entry.updatedAt = new Date();
    }
  }

  await writeShelf(userId, shelf);

  const showcaseEntries = shelf.entries
    .filter((entry) => entry.showcaseOrder !== null)
    .sort((a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0));

  return enrichShelfEntries(showcaseEntries);
}
