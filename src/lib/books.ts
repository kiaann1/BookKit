import { unstable_noStore as noStore } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { BookListItem, CatalogFilters } from "@/lib/books/types";
import {
  getPublishedStorageBookById,
  getStorageCatalogBooks,
  listStorageBooks,
  mergeStorageIntoCatalog,
  storageBookToListItem,
} from "@/lib/books/storage-books";
import { BookStatus } from "@/lib/constants/book-status";
import { buildGenreFilterOptions } from "@/lib/constants/genres";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { resolveBookListCoverUrl } from "@/lib/covers/book-cover-url";

export type { BookListItem, CatalogFilters } from "@/lib/books/types";

function canQueryDatabase() {
  return (
    Boolean(process.env.DATABASE_URL?.trim()) &&
    process.env.SKIP_DATABASE !== "true"
  );
}

async function toBookListItem(book: {
  id: string;
  title: string;
  author: string;
  description: string | null;
  genres: string[];
  publishedAt: Date | null;
  seriesTitle: string | null;
  seriesIndex: number | null;
  status: string;
  coverKey: string | null;
  createdAt: Date;
}): Promise<BookListItem> {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    genres: book.genres,
    publishedAt: book.publishedAt,
    seriesTitle: book.seriesTitle,
    seriesIndex: book.seriesIndex,
    status: book.status as BookListItem["status"],
    coverUrl: resolveBookListCoverUrl(book.id),
    createdAt: book.createdAt,
  };
}

export function buildCatalogWhere(filters: CatalogFilters): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {
    status: BookStatus.PUBLISHED,
  };

  if (filters.genre) {
    where.genres = { has: filters.genre };
  }

  if (filters.q?.trim()) {
    const query = filters.q.trim();
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  return where;
}

async function fetchPublishedRows(where: Prisma.BookWhereInput) {
  if (!canQueryDatabase()) {
    return null;
  }

  try {
    return await prisma.book.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    console.error("[catalog] Failed to load books from database:", error);
    return null;
  }
}

async function getAllPublishedBooks() {
  const storageBooks = await getStorageCatalogBooks({});

  const rows = await fetchPublishedRows({ status: BookStatus.PUBLISHED });
  if (!rows) {
    return storageBooks;
  }

  const dbBooks = await Promise.all(rows.map((row) => toBookListItem(row)));
  return mergeStorageIntoCatalog(dbBooks, {}, storageBooks);
}

async function getFilteredPublishedBooks(filters: CatalogFilters) {
  const storageBooks = await getStorageCatalogBooks(filters);

  const rows = await fetchPublishedRows(buildCatalogWhere(filters));
  if (!rows) {
    return storageBooks;
  }

  const dbBooks = await Promise.all(rows.map((row) => toBookListItem(row)));
  return mergeStorageIntoCatalog(dbBooks, filters, storageBooks);
}

export async function getCatalogData(filters: CatalogFilters = {}) {
  noStore();

  const [allBooks, books] = await Promise.all([
    getAllPublishedBooks(),
    getFilteredPublishedBooks(filters),
  ]);

  return {
    books,
    genreOptions: buildGenreFilterOptions(allBooks),
  };
}

export async function getPublishedBooks(filters: CatalogFilters = {}) {
  const { books } = await getCatalogData(filters);
  return books;
}

export async function getPublishedBookById(id: string) {
  if (canQueryDatabase()) {
    try {
      const book = await prisma.book.findFirst({
        where: { id, status: BookStatus.PUBLISHED },
      });

      if (book) {
        return await toBookListItem(book);
      }
    } catch (error) {
      console.error("[catalog] Failed to load book by id:", id, error);
    }
  }

  return getPublishedStorageBookById(id);
}

export async function getAllBooksForAdmin() {
  const storageRecords = await listStorageBooks();
  const storageMapped = await Promise.all(
    storageRecords.map(async (book) => ({
      ...(await storageBookToListItem(book)),
      uploadedBy: "storage",
      pdfKey: book.pdfKey,
    })),
  );

  if (!(await isDatabaseAvailable())) {
    return storageMapped;
  }

  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: { username: true },
        },
      },
    });

    const mapped = await Promise.all(
      books.map(async (book) => ({
        ...(await toBookListItem(book)),
        uploadedBy: book.uploadedBy.username,
        pdfKey: book.pdfKey,
      })),
    );

    const seen = new Set(mapped.map((book) => book.id));
    for (const book of storageMapped) {
      if (!seen.has(book.id)) {
        mapped.push(book);
      }
    }

    return mapped.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  } catch {
    return storageMapped;
  }
}

export async function getBookForAdmin(id: string) {
  return prisma.book.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { username: true } },
    },
  });
}

export async function getCatalogGenres() {
  const allBooks = await getAllPublishedBooks();
  return buildGenreFilterOptions(allBooks).map((option) => option.genre);
}
