import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import type { ShelfEntry } from "@/lib/shelf/types";

type LocalShelfFile = {
  entries: ShelfEntry[];
};

function shelfPath(userId: string) {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(process.cwd(), "storage", "shelf", `${safeId}.json`);
}

async function readShelf(userId: string): Promise<LocalShelfFile> {
  try {
    const raw = await readFile(shelfPath(userId), "utf-8");
    const parsed = JSON.parse(raw) as LocalShelfFile;
    return {
      entries: parsed.entries.map((entry) => ({
        ...entry,
        currentPage: entry.currentPage ?? null,
        totalPages: entry.totalPages ?? null,
        progressPercent: entry.progressPercent ?? null,
        lastReadAt: entry.lastReadAt ? new Date(entry.lastReadAt) : null,
        startedAt: entry.startedAt ? new Date(entry.startedAt) : null,
        finishedAt: entry.finishedAt ? new Date(entry.finishedAt) : null,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      })),
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
    startedAt: status === "CURRENTLY_READING" ? now : null,
    finishedAt: status === "READ" || status === "DNF" ? now : null,
    currentPage: null,
    totalPages: null,
    progressPercent: null,
    lastReadAt: null,
    createdAt: now,
    updatedAt: now,
  };

  shelf.entries.unshift(entry);
  await writeShelf(userId, shelf);
  return entry;
}

export async function localUpdateShelfStatus(
  userId: string,
  bookId: string,
  status: ShelfStatus,
) {
  const shelf = await readShelf(userId);
  const index = shelf.entries.findIndex((entry) => entry.bookId === bookId);
  if (index === -1) {
    return null;
  }

  const now = new Date();
  const entry = shelf.entries[index];

  if (status === "CURRENTLY_READING" && !entry.startedAt) {
    entry.startedAt = now;
  }
  if ((status === "READ" || status === "DNF") && !entry.finishedAt) {
    entry.finishedAt = now;
  }

  entry.status = status;
  entry.updatedAt = now;
  shelf.entries[index] = entry;
  await writeShelf(userId, shelf);
  return entry;
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
