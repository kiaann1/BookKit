import { existsSync } from "fs";
import path from "path";
import { BookStatus } from "@/lib/constants/book-status";
import { getPublishedBookPdfKey } from "@/lib/books/pdf";
import { prisma } from "@/lib/db";
import { fileExists, getStorageDriver } from "@/lib/storage";

export type Phase3Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  hint?: string;
};

export type Phase3Report = {
  ok: boolean;
  checks: Phase3Check[];
  storageDriver: string;
};

function pushCheck(checks: Phase3Check[], check: Phase3Check) {
  checks.push(check);
}

export async function runPhase3Checks(): Promise<Phase3Report> {
  const checks: Phase3Check[] = [];
  const storageDriver = getStorageDriver();
  const root = process.cwd();

  const readerPath = path.join(root, "src/components/reader/pdf-reader.tsx");
  const progressApiPath = path.join(
    root,
    "src/app/api/progress/[bookId]/route.ts",
  );
  const pdfApiPath = path.join(
    root,
    "src/app/api/files/books/[bookId]/pdf/route.ts",
  );

  pushCheck(checks, {
    id: "reader_component",
    label: "PDF reader component present",
    ok: existsSync(readerPath),
  });

  pushCheck(checks, {
    id: "progress_api",
    label: "Reading progress API present",
    ok: existsSync(progressApiPath),
  });

  pushCheck(checks, {
    id: "pdf_api",
    label: "Secure PDF delivery API present",
    ok: existsSync(pdfApiPath),
  });

  const hasDatabaseUrl =
    Boolean(process.env.DATABASE_URL?.trim()) &&
    process.env.SKIP_DATABASE !== "true";

  let sampleBookId: string | null = null;

  if (hasDatabaseUrl) {
    try {
      const book = await prisma.book.findFirst({
        where: { status: BookStatus.PUBLISHED },
        select: { id: true, pdfKey: true },
        orderBy: { createdAt: "desc" },
      });

      sampleBookId = book?.id ?? null;

      pushCheck(checks, {
        id: "published_books",
        label: "Published books in database",
        ok: Boolean(book),
        detail: book ? `Latest: ${book.id}` : "No published books found",
        hint: book ? undefined : "Upload a book from Admin or run seed SQL.",
      });

      if (book) {
        const resolvedKey = await getPublishedBookPdfKey(book.id);
        const pdfReady = resolvedKey ? await fileExists(resolvedKey) : false;

        pushCheck(checks, {
          id: "sample_pdf",
          label: "Sample published book has a PDF in storage",
          ok: pdfReady,
          detail: resolvedKey ?? book.pdfKey,
          hint: pdfReady
            ? undefined
            : "Re-upload the PDF or run npm run db:upload-files.",
        });
      }
    } catch (error) {
      pushCheck(checks, {
        id: "database",
        label: "Database reachable for Phase 3 checks",
        ok: false,
        detail: error instanceof Error ? error.message : "Query failed",
        hint: "Check DATABASE_URL and run prisma migrate deploy.",
      });
    }
  } else {
    pushCheck(checks, {
      id: "database",
      label: "Database configured for progress sync",
      ok: false,
      detail: "DATABASE_URL missing or SKIP_DATABASE=true",
      hint: "Progress sync needs Postgres in production.",
    });
  }

  pushCheck(checks, {
    id: "storage_driver",
    label: "Storage driver suitable for reader",
    ok:
      storageDriver === "local"
        ? process.env.VERCEL !== "1"
        : storageDriver === "blob" || storageDriver === "s3",
    detail: `Using ${storageDriver}`,
    hint:
      process.env.VERCEL === "1" && storageDriver === "local"
        ? "Connect Vercel Blob (BLOB_READ_WRITE_TOKEN) for PDFs."
        : undefined,
  });

  if (sampleBookId) {
    pushCheck(checks, {
      id: "pdf_key_resolution",
      label: "PDF key resolves for sample book",
      ok: Boolean(await getPublishedBookPdfKey(sampleBookId)),
      detail: sampleBookId,
    });
  }

  const ok = checks.every((check) => check.ok);

  return { ok, checks, storageDriver };
}
