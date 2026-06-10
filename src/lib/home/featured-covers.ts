import { readFile, readdir } from "fs/promises";
import path from "path";
import { parseBookSlug } from "@/lib/books/metadata";
import { BookStatus } from "@/lib/constants/book-status";
import { findLocalCoverKey } from "@/lib/covers/ensure-cover";
import { prisma } from "@/lib/db";

export type FeaturedCover = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function getStorageCovers(): Promise<FeaturedCover[]> {
  const root = path.join(process.cwd(), "storage", "books");
  let entries;

  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const covers: FeaturedCover[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const bookId = entry.name;
    if (!findLocalCoverKey(bookId)) {
      continue;
    }

    const { title: slugTitle } = parseBookSlug(bookId);
    let title = slugTitle;
    let author = "";

    try {
      const raw = await readFile(
        path.join(root, bookId, "metadata.json"),
        "utf-8",
      );
      const metadata = JSON.parse(raw) as {
        title?: string;
        author?: string;
      };
      title = metadata.title?.trim() || title;
      author = metadata.author?.trim() || "";
    } catch {
      // Use slug-derived title when metadata is missing.
    }

    covers.push({
      id: bookId,
      title,
      author: author || "Unknown author",
      coverUrl: `/api/files/covers/${bookId}`,
    });
  }

  return covers;
}

async function getDatabaseCovers(): Promise<FeaturedCover[]> {
  if (!process.env.DATABASE_URL?.trim() || process.env.SKIP_DATABASE === "true") {
    return [];
  }

  try {
    const rows = await prisma.book.findMany({
      where: {
        status: BookStatus.PUBLISHED,
        coverKey: { not: null },
      },
      select: {
        id: true,
        title: true,
        author: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      coverUrl: `/api/files/covers/${row.id}`,
    }));
  } catch {
    return [];
  }
}

export async function getFeaturedCovers(count = 8): Promise<FeaturedCover[]> {
  const [storageCovers, databaseCovers] = await Promise.all([
    getStorageCovers(),
    getDatabaseCovers(),
  ]);

  const byId = new Map<string, FeaturedCover>();
  for (const cover of [...databaseCovers, ...storageCovers]) {
    byId.set(cover.id, cover);
  }

  const all = [...byId.values()];
  if (all.length === 0) {
    return [];
  }

  return shuffle(all).slice(0, Math.min(count, all.length));
}

export async function getFeaturedCoverCount(): Promise<number> {
  const [storageCovers, databaseCovers] = await Promise.all([
    getStorageCovers(),
    getDatabaseCovers(),
  ]);

  const ids = new Set([
    ...storageCovers.map((cover) => cover.id),
    ...databaseCovers.map((cover) => cover.id),
  ]);

  return ids.size;
}
