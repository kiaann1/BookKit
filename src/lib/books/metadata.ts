import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { BookStatus } from "@/lib/constants/book-status";
import { readFile as readStoredFile, uploadFile } from "@/lib/storage";
import { getStorageDriver } from "@/lib/storage/driver";
import { uploadLocal } from "@/lib/storage/local";

export const storageBookMetadataSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  description: z.string().optional(),
  genres: z.array(z.string()).default([]),
  publishedAt: z.string().optional(),
  seriesTitle: z.string().optional(),
  seriesIndex: z.number().int().optional(),
  status: z
    .enum([BookStatus.PUBLISHED, BookStatus.DRAFT, BookStatus.ARCHIVED])
    .default(BookStatus.PUBLISHED),
});

export type StorageBookMetadata = z.infer<typeof storageBookMetadataSchema>;

export function bookMetadataKey(bookId: string) {
  return `books/${bookId}/metadata.json`;
}

function metadataPath(bookId: string) {
  return path.join(process.cwd(), "storage", bookMetadataKey(bookId));
}

export async function readBookMetadata(
  bookId: string,
): Promise<StorageBookMetadata | null> {
  const key = bookMetadataKey(bookId);

  if (getStorageDriver() !== "local") {
    const bytes = await readStoredFile(key);
    if (!bytes) {
      return null;
    }
    try {
      const parsed = storageBookMetadataSchema.safeParse(
        JSON.parse(bytes.toString("utf-8")),
      );
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  try {
    const raw = await readFile(metadataPath(bookId), "utf-8");
    const parsed = storageBookMetadataSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function writeBookMetadata(
  bookId: string,
  metadata: StorageBookMetadata,
) {
  const parsed = storageBookMetadataSchema.parse(metadata);
  const body = Buffer.from(JSON.stringify(parsed, null, 2), "utf-8");
  const key = bookMetadataKey(bookId);

  if (getStorageDriver() === "local") {
    await uploadLocal(key, body);
    return;
  }

  await uploadFile({
    key,
    body,
    contentType: "application/json",
    access: "private",
  });
}

export function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export type ParsedBookSlug = {
  title: string;
  authorHint: string;
  /** Title slug used for storage paths (without author segment). */
  titleSlug: string;
};

/**
 * Parse a storage folder name into title + optional author hint.
 *
 * Preferred: `title-slug--author-slug` (double hyphen)
 *   e.g. `project-hail-mary--andy-weir`, `the-ascended--greenwich-lennox`
 *
 * Best-effort fallback for `the-{word}-{author}-{author}` (exactly 4 segments):
 *   e.g. `the-ascended-greenwich-lennox`
 */
export function parseBookSlug(bookId: string): ParsedBookSlug {
  if (bookId.includes("--")) {
    const splitAt = bookId.indexOf("--");
    const titleSlug = bookId.slice(0, splitAt);
    const authorSlug = bookId.slice(splitAt + 2);

    return {
      titleSlug,
      title: slugToTitle(titleSlug),
      authorHint: slugToTitle(authorSlug),
    };
  }

  const parts = bookId.split("-").filter(Boolean);
  if (parts[0] === "the" && parts.length === 4) {
    return {
      titleSlug: parts.slice(0, 2).join("-"),
      title: slugToTitle(parts.slice(0, 2).join("-")),
      authorHint: slugToTitle(parts.slice(2).join("-")),
    };
  }

  return {
    titleSlug: bookId,
    title: slugToTitle(bookId),
    authorHint: "",
  };
}

export function bookSlugWithAuthor(title: string, author: string) {
  const titleSlug = titleToSlug(title);
  const authorSlug = titleToSlug(author);
  return authorSlug ? `${titleSlug}--${authorSlug}` : titleSlug;
}

export function titleToSlug(title: string) {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "book";
}
