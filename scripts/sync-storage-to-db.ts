/**
 * Sync books from ./storage/books into PostgreSQL (and optionally S3).
 *
 * Usage:
 *   npx tsx scripts/sync-storage-to-db.ts              # upsert via Prisma
 *   npx tsx scripts/sync-storage-to-db.ts --sql         # print SQL for Neon
 *   npx tsx scripts/sync-storage-to-db.ts --sql --out scripts/seed-books.sql
 *   npx tsx scripts/sync-storage-to-db.ts --upload-s3   # also upload PDFs/covers to S3
 *
 * Requires DATABASE_URL in .env (Prisma reads it automatically).
 * For --upload-s3, set STORAGE_DRIVER=s3 and S3_* env vars.
 */

import { existsSync } from "fs";
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  parseBookSlug,
  readBookMetadata,
  storageBookMetadataSchema,
} from "../src/lib/books/metadata";
import { BookStatus } from "../src/lib/constants/book-status";
import { bookCoverKey, bookPdfKey } from "../src/lib/storage/keys";
import { uploadFile } from "../src/lib/storage";
import { isS3Configured } from "../src/lib/storage/s3";

const BOOKS_ROOT = path.join(process.cwd(), "storage", "books");
const SYSTEM_UPLOADER_ID = "bookkit-system-uploader";

type LocalBook = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  genres: string[];
  publishedAt: Date | null;
  seriesTitle: string | null;
  seriesIndex: number | null;
  status: BookStatus;
  pdfKey: string;
  coverKey: string | null;
};

function findCoverKey(bookId: string) {
  for (const extension of ["jpg", "png", "webp"] as const) {
    const key = bookCoverKey(bookId, extension);
    if (existsSync(path.join(process.cwd(), "storage", key))) {
      return key;
    }
  }
  return null;
}

async function loadLocalBooks(): Promise<LocalBook[]> {
  let entries: string[];
  try {
    entries = await readdir(BOOKS_ROOT, { withFileTypes: true }).then((rows) =>
      rows.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    );
  } catch {
    return [];
  }

  const books: LocalBook[] = [];

  for (const id of entries.sort()) {
    const pdfKey = bookPdfKey(id);
    if (!existsSync(path.join(process.cwd(), "storage", pdfKey))) {
      console.warn(`Skipping ${id} — no original.pdf`);
      continue;
    }

    const metadata = await readBookMetadata(id);
    const parsed = metadata
      ? storageBookMetadataSchema.parse(metadata)
      : null;
    const { title: slugTitle, authorHint } = parseBookSlug(id);

    books.push({
      id,
      title: parsed?.title?.trim() || slugTitle,
      author: parsed?.author?.trim() || authorHint || "Unknown author",
      description: parsed?.description?.trim() || null,
      genres: parsed?.genres ?? [],
      publishedAt: parsed?.publishedAt ? new Date(parsed.publishedAt) : null,
      seriesTitle: parsed?.seriesTitle ?? null,
      seriesIndex: parsed?.seriesIndex ?? null,
      status: parsed?.status ?? BookStatus.PUBLISHED,
      pdfKey,
      coverKey: findCoverKey(id),
    });
  }

  return books;
}

function sqlString(value: string | null) {
  if (value === null) {
    return "NULL";
  }
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlTextArray(values: string[]) {
  if (values.length === 0) {
    return "ARRAY[]::text[]";
  }
  return `ARRAY[${values.map((value) => sqlString(value)).join(", ")}]::text[]`;
}

function buildSql(books: LocalBook[]) {
  const lines = [
    "-- BookKit: seed books from local storage metadata",
    "-- Run in Neon SQL Editor.",
    "-- PDFs/covers are NOT uploaded by this script — use:",
    "--   npx tsx scripts/sync-storage-to-db.ts --upload-s3",
    "",
    "BEGIN;",
    "",
    "-- System uploader (used when no registered user exists yet)",
    `INSERT INTO "User" (
  "id", "email", "username", "name", "role", "createdAt", "updatedAt"
) VALUES (
  ${sqlString(SYSTEM_UPLOADER_ID)},
  'system@bookkit.internal',
  'bookkit_system',
  'BookKit System',
  'ADMIN'::"UserRole",
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "updatedAt" = NOW();`,
    "",
  ];

  for (const book of books) {
    lines.push(`-- ${book.title}`);
    lines.push(`INSERT INTO "Book" (
  "id", "title", "author", "description", "coverKey", "pdfKey", "genres",
  "publishedAt", "seriesTitle", "seriesIndex", "status", "uploadedById",
  "createdAt", "updatedAt"
) VALUES (
  ${sqlString(book.id)},
  ${sqlString(book.title)},
  ${sqlString(book.author)},
  ${sqlString(book.description)},
  ${sqlString(book.coverKey)},
  ${sqlString(book.pdfKey)},
  ${sqlTextArray(book.genres)},
  ${book.publishedAt ? sqlString(book.publishedAt.toISOString()) : "NULL"},
  ${sqlString(book.seriesTitle)},
  ${book.seriesIndex ?? "NULL"},
  ${sqlString(book.status)}::"BookStatus",
  COALESCE(
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1),
    (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1),
    ${sqlString(SYSTEM_UPLOADER_ID)}
  ),
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "author" = EXCLUDED."author",
  "description" = EXCLUDED."description",
  "coverKey" = EXCLUDED."coverKey",
  "pdfKey" = EXCLUDED."pdfKey",
  "genres" = EXCLUDED."genres",
  "publishedAt" = EXCLUDED."publishedAt",
  "seriesTitle" = EXCLUDED."seriesTitle",
  "seriesIndex" = EXCLUDED."seriesIndex",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();
`);
  }

  lines.push("COMMIT;", "");
  return lines.join("\n");
}

async function resolveUploaderId(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (admin) {
    return admin.id;
  }

  const anyUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!anyUser) {
    throw new Error(
      "No users in the database. Register an account first, then re-run this script.",
    );
  }

  return anyUser.id;
}

async function uploadBookFiles(book: LocalBook) {
  if (!isS3Configured()) {
    console.warn("S3 not configured — skipping file upload for", book.id);
    return;
  }

  const pdfPath = path.join(process.cwd(), "storage", book.pdfKey);
  const pdfBody = await readFile(pdfPath);
  await uploadFile({
    key: book.pdfKey,
    body: pdfBody,
    contentType: "application/pdf",
    access: "private",
  });
  console.log("Uploaded PDF:", book.pdfKey);

  if (book.coverKey) {
    const coverPath = path.join(process.cwd(), "storage", book.coverKey);
    const coverBody = await readFile(coverPath);
    const extension = book.coverKey.split(".").pop() ?? "jpg";
    const contentType =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg";
    await uploadFile({
      key: book.coverKey,
      body: coverBody,
      contentType,
      access: "public",
    });
    console.log("Uploaded cover:", book.coverKey);
  }
}

async function syncWithPrisma(books: LocalBook[], uploadS3: boolean) {
  const prisma = new PrismaClient();
  const uploadedById = await resolveUploaderId(prisma);

  try {
    for (const book of books) {
      await prisma.book.upsert({
        where: { id: book.id },
        create: {
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          genres: book.genres,
          publishedAt: book.publishedAt,
          seriesTitle: book.seriesTitle,
          seriesIndex: book.seriesIndex,
          status: book.status,
          pdfKey: book.pdfKey,
          coverKey: book.coverKey,
          uploadedById,
        },
        update: {
          title: book.title,
          author: book.author,
          description: book.description,
          genres: book.genres,
          publishedAt: book.publishedAt,
          seriesTitle: book.seriesTitle,
          seriesIndex: book.seriesIndex,
          status: book.status,
          pdfKey: book.pdfKey,
          coverKey: book.coverKey,
          uploadedById,
        },
      });

      console.log(`Synced: ${book.title} (${book.id})`);

      if (uploadS3) {
        await uploadBookFiles(book);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const books = await loadLocalBooks();

  if (books.length === 0) {
    console.error("No books found in storage/books with original.pdf");
    process.exit(1);
  }

  console.log(`Found ${books.length} book(s) in storage/books\n`);

  const sqlOnly = process.argv.includes("--sql");
  const outIndex = process.argv.indexOf("--out");
  const outPath = outIndex >= 0 ? process.argv[outIndex + 1] : null;
  const uploadS3 = process.argv.includes("--upload-s3");

  const sql = buildSql(books);

  if (sqlOnly) {
    if (outPath) {
      await writeFile(path.resolve(outPath), sql, "utf-8");
      console.log(`Wrote SQL to ${outPath}`);
    } else {
      console.log(sql);
    }
    return;
  }

  await syncWithPrisma(books, uploadS3);

  if (!uploadS3 && !isS3Configured()) {
    console.log(
      "\nNote: Catalog metadata is in Postgres. PDFs on Vercel need S3 — re-run with --upload-s3 after configuring S3 env vars.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
