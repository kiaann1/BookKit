import { existsSync } from "fs";
import { readdir, stat } from "fs/promises";
import path from "path";
import type { BookListItem, CatalogFilters } from "@/lib/books/types";
import { ensureBookMetadata } from "@/lib/books/ensure-metadata";
import { parseBookSlug } from "@/lib/books/metadata";
import { BookStatus } from "@/lib/constants/book-status";
import { resolveBookCoverUrl } from "@/lib/covers/book-cover-url";
import { ensureBookCover, findLocalCoverKey } from "@/lib/covers/ensure-cover";
import { bookPdfKey } from "@/lib/storage/keys";

const BOOKS_ROOT = path.join(process.cwd(), "storage", "books");

export type StorageBookRecord = {
  id: string;
  pdfKey: string;
  coverKey: string | null;
  title: string;
  author: string;
  description: string | null;
  genres: string[];
  publishedAt: Date | null;
  seriesTitle: string | null;
  seriesIndex: number | null;
  status: BookListItem["status"];
  createdAt: Date;
};

function storageFileExists(key: string) {
  const fullPath = path.join(process.cwd(), "storage", key);
  return existsSync(fullPath);
}

export function hasStoragePdf(bookId: string) {
  return storageFileExists(bookPdfKey(bookId));
}

function storageBookMatchesFilters(
  book: StorageBookRecord,
  filters: CatalogFilters,
) {
  if (book.status !== BookStatus.PUBLISHED) {
    return false;
  }

  if (filters.genre && !book.genres.includes(filters.genre)) {
    return false;
  }

  if (filters.q?.trim()) {
    const query = filters.q.trim().toLowerCase();
    const haystack = [book.title, book.author, book.description ?? ""]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  return true;
}

async function loadStorageBook(bookId: string): Promise<StorageBookRecord | null> {
  const pdfKey = bookPdfKey(bookId);
  if (!storageFileExists(pdfKey)) {
    return null;
  }

  const metadata = await ensureBookMetadata(bookId);
  const pdfPath = path.join(process.cwd(), "storage", pdfKey);
  const pdfStat = await stat(pdfPath);

  const { title: slugTitle } = parseBookSlug(bookId);
  const title = metadata.title?.trim() || slugTitle;
  const author = metadata.author?.trim() ?? "";

  let coverKey = findLocalCoverKey(bookId);
  if (!coverKey && title.trim()) {
    coverKey = await ensureBookCover(bookId, title, author);
  }

  return {
    id: bookId,
    pdfKey,
    coverKey,
    title,
    author: author || "Unknown author",
    description: metadata.description?.trim() || null,
    genres: metadata.genres ?? [],
    publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
    seriesTitle: metadata.seriesTitle ?? null,
    seriesIndex: metadata.seriesIndex ?? null,
    status: metadata.status ?? BookStatus.PUBLISHED,
    createdAt: pdfStat.birthtime,
  };
}

export async function listStorageBooks(): Promise<StorageBookRecord[]> {
  let entries;
  try {
    entries = await readdir(BOOKS_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }

  const books: StorageBookRecord[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const book = await loadStorageBook(entry.name);
    if (book) {
      books.push(book);
    }
  }

  return books.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function storageBookToListItem(
  book: StorageBookRecord,
): Promise<BookListItem> {
  const coverUrl = resolveBookCoverUrl(book.id);

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    genres: book.genres,
    publishedAt: book.publishedAt,
    seriesTitle: book.seriesTitle,
    seriesIndex: book.seriesIndex,
    status: book.status,
    coverUrl,
    createdAt: book.createdAt,
  };
}

export async function getStorageBookById(
  bookId: string,
): Promise<StorageBookRecord | null> {
  return loadStorageBook(bookId);
}

export async function getStorageCatalogBooks(
  filters: CatalogFilters = {},
): Promise<BookListItem[]> {
  const books = await listStorageBooks();
  const filtered = books.filter((book) =>
    storageBookMatchesFilters(book, filters),
  );
  return Promise.all(filtered.map(storageBookToListItem));
}

export async function getPublishedStorageBookById(
  bookId: string,
): Promise<BookListItem | null> {
  const book = await loadStorageBook(bookId);
  if (!book || book.status !== BookStatus.PUBLISHED) {
    return null;
  }
  return storageBookToListItem(book);
}

export function mergeStorageIntoCatalog(
  books: BookListItem[],
  filters: CatalogFilters,
  storageBooks: BookListItem[],
) {
  const seen = new Set(books.map((book) => book.id));
  const extras = storageBooks.filter((book) => !seen.has(book.id));
  const merged = [...books, ...extras];

  return merged.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
