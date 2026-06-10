/**
 * Sync books from ./storage/books into PostgreSQL (and optionally Blob/S3).
 *
 * Usage:
 *   npx tsx scripts/sync-storage-to-db.ts                    # upsert via Prisma
 *   npx tsx scripts/sync-storage-to-db.ts --sql              # print SQL for Neon
 *   npx tsx scripts/sync-storage-to-db.ts --sql --out scripts/seed-books.sql
 *   npx tsx scripts/sync-storage-to-db.ts --upload-files       # DB sync + upload (falls back to files-only if DB unreachable)
 *   npx tsx scripts/sync-storage-to-db.ts --files-only         # upload only (use this on networks that block Neon)
 *   npx tsx scripts/sync-storage-to-db.ts --files-only --skip-existing   # skip files already in Blob/S3
 *
 * Requires DATABASE_URL in .env for DB sync (not needed with --files-only).
 * For uploads, set BLOB_READ_WRITE_TOKEN (Vercel Blob) or S3_* env vars in .env.
 * Set BLOB_DISABLE_MULTIPART=true if uploads hang on your network.
 */

import { config } from "dotenv";

config();

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
import { normalizeDatabaseUrl } from "../src/lib/db";
import { fileExists, isBlobConfigured, uploadFile } from "../src/lib/storage";
import { isS3Configured } from "../src/lib/storage/s3";

const BOOKS_ROOT = path.join(process.cwd(), "storage", "books");
const SYSTEM_UPLOADER_ID = "bookkit-system-uploader";
const DB_LOOKUP_TIMEOUT_MS = 12_000;
const UPLOAD_TIMEOUT_MS = 10 * 60_000;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${ms / 1000}s`));
      }, ms);
    }),
  ]);
}

function createUploadProgress(label: string) {
  let lastLogged = 0;

  return (loaded: number, total: number) => {
    const now = Date.now();
    if (now - lastLogged < 1500 && loaded < total) {
      return;
    }

    lastLogged = now;
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    process.stdout.write(
      `\r  ${label}… ${pct}% (${formatBytes(loaded)} / ${formatBytes(total)})   `,
    );
  };
}

function finishUploadProgress() {
  process.stdout.write("\n");
}

function createScriptPrismaClient() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return new PrismaClient();
  }

  let datasourceUrl = normalizeDatabaseUrl(raw);
  if (!datasourceUrl.includes("connect_timeout=")) {
    const separator = datasourceUrl.includes("?") ? "&" : "?";
    datasourceUrl = `${datasourceUrl}${separator}connect_timeout=10`;
  }

  return new PrismaClient({ datasourceUrl });
}

function isDbUnreachable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";

  return (
    name === "PrismaClientInitializationError" ||
    message.includes("Can't reach database") ||
    message.includes("timed out")
  );
}

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
      console.warn(
        `Skipping ${id} — no storage/${pdfKey} (check folder name matches the book id in the database)`,
      );
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
    "--   npx tsx scripts/sync-storage-to-db.ts --upload-files",
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

function isRemoteStorageConfigured() {
  return isBlobConfigured() || isS3Configured();
}

async function uploadBookFiles(
  book: LocalBook,
  index: number,
  total: number,
  skipExisting: boolean,
) {
  if (!isRemoteStorageConfigured()) {
    console.warn("Blob/S3 not configured — skipping file upload for", book.id);
    return;
  }

  console.log(`[${index}/${total}] ${book.title} (${book.id})`);

  const pdfPath = path.join(process.cwd(), "storage", book.pdfKey);
  if (skipExisting && (await fileExists(book.pdfKey))) {
    console.log("  Skipping PDF (already in remote storage)");
  } else {
    console.log("  Reading PDF from disk…");
    const pdfBody = await readFile(pdfPath);
    const pdfProgress = createUploadProgress("Uploading PDF");
    await withTimeout(
      uploadFile({
        key: book.pdfKey,
        body: pdfBody,
        contentType: "application/pdf",
        access: "private",
        onProgress: pdfProgress,
      }),
      UPLOAD_TIMEOUT_MS,
      `PDF upload for ${book.id}`,
    );
    finishUploadProgress();
    console.log("  ✓ PDF uploaded");
  }

  if (book.coverKey) {
    if (skipExisting && (await fileExists(book.coverKey))) {
      console.log("  Skipping cover (already in remote storage)");
    } else {
      const coverPath = path.join(process.cwd(), "storage", book.coverKey);
      console.log("  Reading cover from disk…");
      const coverBody = await readFile(coverPath);
      const extension = book.coverKey.split(".").pop() ?? "jpg";
      const contentType =
        extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg";
      const coverProgress = createUploadProgress("Uploading cover");
      await withTimeout(
        uploadFile({
          key: book.coverKey,
          body: coverBody,
          contentType,
          access: "public",
          onProgress: coverProgress,
        }),
        UPLOAD_TIMEOUT_MS,
        `Cover upload for ${book.id}`,
      );
      finishUploadProgress();
      console.log("  ✓ Cover uploaded");
    }
  }
}

async function uploadAllBookFiles(books: LocalBook[], skipExisting: boolean) {
  if (!isRemoteStorageConfigured()) {
    console.error(
      "Blob/S3 is not configured. Add BLOB_READ_WRITE_TOKEN (from Vercel → Storage → your Blob store) to .env",
    );
    process.exit(1);
  }

  const target = isBlobConfigured() ? "Vercel Blob" : "S3";
  console.log(`Uploading to ${target}…`);
  if (skipExisting) {
    console.log("Skipping files that already exist in remote storage.\n");
  } else {
    console.log(
      "Large PDFs can take several minutes on slow networks — progress updates every ~1.5s.\n",
    );
  }

  let index = 0;
  for (const book of books) {
    index += 1;
    await uploadBookFiles(book, index, books.length, skipExisting);
  }

  console.log(`\nUploaded files for ${books.length} book(s).`);
  console.log(
    "Book metadata must already exist in Neon (e.g. scripts/seed-books.sql).",
  );

  const coverUpdates = books.filter((book) => book.coverKey);
  if (coverUpdates.length > 0) {
    console.log(
      "\nIf a cover was added after the initial seed, run in Neon SQL Editor:",
    );
    for (const book of coverUpdates) {
      console.log(
        `UPDATE "Book" SET "coverKey" = '${book.coverKey}' WHERE "id" = '${book.id}';`,
      );
    }
  }
}

async function syncWithPrisma(books: LocalBook[], uploadFiles: boolean) {
  const prisma = createScriptPrismaClient();
  console.log("Connecting to database…");
  const uploadedById = await withTimeout(
    resolveUploaderId(prisma),
    DB_LOOKUP_TIMEOUT_MS,
    "Database lookup",
  );

  try {
    if (uploadFiles) {
      const target = isBlobConfigured() ? "Vercel Blob" : "S3";
      console.log(`\nUploading files to ${target}…\n`);
    }

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

      if (uploadFiles) {
        const index = books.indexOf(book) + 1;
        await uploadBookFiles(
          book,
          index,
          books.length,
          process.argv.includes("--skip-existing"),
        );
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
  const filesOnly = process.argv.includes("--files-only");
  const skipExisting = process.argv.includes("--skip-existing");
  const uploadFiles =
    filesOnly ||
    process.argv.includes("--upload-files") ||
    process.argv.includes("--upload-s3");

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

  if (filesOnly) {
    await uploadAllBookFiles(books, skipExisting);
    return;
  }

  try {
    await syncWithPrisma(books, uploadFiles);
  } catch (error) {
    if (uploadFiles && isDbUnreachable(error)) {
      console.warn(
        "\nDatabase unreachable from this network — uploading files to Blob/S3 only.",
      );
      console.warn(
        "(Book metadata must already be in Neon, e.g. scripts/seed-books.sql.)\n",
      );
      await uploadAllBookFiles(books, skipExisting);
      return;
    }
    throw error;
  }

  if (!uploadFiles && !isRemoteStorageConfigured()) {
    console.log(
      "\nNote: Catalog metadata is in Postgres. PDFs on Vercel need Blob or S3 — re-run with --upload-files after configuring storage env vars.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
