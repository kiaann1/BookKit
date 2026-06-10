import { BookStatus } from "@/lib/constants/book-status";
import { CATALOG_SEED_BOOK_COUNT } from "@/lib/books/catalog-seed";
import { resolveStoredCoverKey } from "@/lib/covers/stored-cover-key";
import { prisma } from "@/lib/db";
import { fileExists, getStorageDriver, isBlobConfigured } from "@/lib/storage";
import { readBlob } from "@/lib/storage/blob";

export type Phase1Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  hint?: string;
};

export type Phase1Report = {
  ok: boolean;
  checks: Phase1Check[];
  publishedBookCount: number;
  storageDriver: string;
};

function pushCheck(
  checks: Phase1Check[],
  check: Phase1Check,
): Phase1Check[] {
  checks.push(check);
  return checks;
}

export async function runPhase1Checks(): Promise<Phase1Report> {
  const checks: Phase1Check[] = [];
  const onVercel = process.env.VERCEL === "1";
  const storageDriver = getStorageDriver();

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const skipDatabase = process.env.SKIP_DATABASE === "true";
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET?.trim());

  pushCheck(checks, {
    id: "database_url",
    label: "Database configured",
    ok: hasDatabaseUrl && !skipDatabase,
    detail: skipDatabase
      ? "SKIP_DATABASE is set"
      : hasDatabaseUrl
        ? "DATABASE_URL is set"
        : "DATABASE_URL is missing",
    hint: skipDatabase
      ? "Unset SKIP_DATABASE on Vercel so the catalog reads from Neon."
      : !hasDatabaseUrl
        ? "Add DATABASE_URL in Vercel → Settings → Environment Variables."
        : undefined,
  });

  pushCheck(checks, {
    id: "auth_secret",
    label: "Auth secret configured",
    ok: hasAuthSecret || process.env.DISABLE_AUTH === "true",
    detail: hasAuthSecret
      ? "AUTH_SECRET is set"
      : process.env.DISABLE_AUTH === "true"
        ? "Skipped (DISABLE_AUTH=true)"
        : "AUTH_SECRET is missing",
    hint: !hasAuthSecret
      ? "Generate with: openssl rand -base64 32"
      : undefined,
  });

  const blobConfigured = isBlobConfigured();
  const storageOk =
    storageDriver === "local"
      ? !onVercel
      : storageDriver === "blob"
        ? blobConfigured
        : true;

  pushCheck(checks, {
    id: "storage",
    label: "File storage ready",
    ok: storageOk,
    detail: `Driver: ${storageDriver}${blobConfigured ? " (Blob configured)" : ""}`,
    hint: onVercel && storageDriver !== "blob"
      ? "Unset STORAGE_DRIVER=local on Vercel and connect a Blob store to this project."
      : onVercel && !blobConfigured
        ? "Add BLOB_READ_WRITE_TOKEN (connect Blob store in Vercel Storage), then redeploy."
        : undefined,
  });

  let publishedBookCount = 0;
  let books: Array<{
    id: string;
    title: string;
    pdfKey: string;
    coverKey: string | null;
  }> = [];

  if (hasDatabaseUrl && !skipDatabase) {
    try {
      publishedBookCount = await prisma.book.count({
        where: { status: BookStatus.PUBLISHED },
      });

      books = await prisma.book.findMany({
        where: { status: BookStatus.PUBLISHED },
        select: { id: true, title: true, pdfKey: true, coverKey: true },
        orderBy: { title: "asc" },
      });

      pushCheck(checks, {
        id: "catalog_count",
        label: "Published books in catalog",
        ok: publishedBookCount > 0,
        detail: `${publishedBookCount} published book(s)`,
        hint:
          publishedBookCount === 0
            ? "Admin → Manage books → Seed default catalog, or run scripts/seed-books.sql in Neon."
            : publishedBookCount < CATALOG_SEED_BOOK_COUNT
              ? `Expected at least ${CATALOG_SEED_BOOK_COUNT} after seeding the default library.`
              : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Database error";
      pushCheck(checks, {
        id: "catalog_count",
        label: "Published books in catalog",
        ok: false,
        detail: message,
        hint: "Check DATABASE_URL and that migrations have been applied.",
      });
    }
  }

  if (books.length > 0) {
    const missingPdfKeys = books.filter(
      (book) => !book.pdfKey || book.pdfKey === "pending",
    );
    pushCheck(checks, {
      id: "pdf_keys",
      label: "All books have PDF keys",
      ok: missingPdfKeys.length === 0,
      detail:
        missingPdfKeys.length === 0
          ? "Every published book has a pdfKey"
          : `Missing pdfKey: ${missingPdfKeys.map((b) => b.title).join(", ")}`,
    });

    const coverIssues: string[] = [];
    for (const book of books) {
      const resolved = await resolveStoredCoverKey(book.id, book.coverKey);
      if (!resolved) {
        coverIssues.push(book.title);
        continue;
      }
      if (!(await fileExists(resolved))) {
        coverIssues.push(book.title);
      }
    }

    pushCheck(checks, {
      id: "covers",
      label: "Covers available in storage",
      ok: coverIssues.length === 0,
      detail:
        coverIssues.length === 0
          ? "Every published book has a readable cover"
          : `Missing cover: ${coverIssues.join(", ")}`,
      hint:
        coverIssues.length > 0
          ? "Run npm run db:upload-files locally, or upload covers via Admin → Edit book."
          : undefined,
    });

    const pdfIssues: string[] = [];
    for (const book of books) {
      if (!book.pdfKey || book.pdfKey === "pending") {
        continue;
      }
      if (!(await fileExists(book.pdfKey))) {
        pdfIssues.push(book.title);
      }
    }

    pushCheck(checks, {
      id: "pdfs_in_storage",
      label: "PDFs available in storage",
      ok: pdfIssues.length === 0,
      detail:
        pdfIssues.length === 0
          ? "Every published book PDF is in storage"
          : `Missing PDF: ${pdfIssues.join(", ")}`,
      hint:
        pdfIssues.length > 0
          ? "Run npm run db:upload-files (or Admin → Upload book on Vercel)."
          : undefined,
    });

    const sample = books[0];
    if (sample?.pdfKey && sample.pdfKey !== "pending") {
      let sampleReadable = false;
      if (storageDriver === "blob") {
        const bytes = await readBlob(sample.pdfKey);
        sampleReadable = bytes !== null && bytes.byteLength > 0;
      } else {
        sampleReadable = await fileExists(sample.pdfKey);
      }

      pushCheck(checks, {
        id: "sample_pdf_read",
        label: "Sample PDF readable",
        ok: sampleReadable,
        detail: sampleReadable
          ? `Read ${sample.pdfKey} (${sample.title})`
          : `Could not read ${sample.pdfKey}`,
        hint: !sampleReadable
          ? "Blob token may not match the store where files were uploaded — reconnect Blob store and redeploy."
          : undefined,
      });
    }
  }

  const ok = checks.every((check) => check.ok);

  return {
    ok,
    checks,
    publishedBookCount,
    storageDriver,
  };
}
