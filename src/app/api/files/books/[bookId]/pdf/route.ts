import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { resolveBookId } from "@/lib/books/paths";
import { getPublishedBookPdfKey } from "@/lib/books/pdf";
import { pdfRangeFromLocalKey } from "@/lib/files/pdf-range-local";
import { pdfRangeResponse } from "@/lib/files/pdf-response";
import { isValidPdfBuffer } from "@/lib/files/pdf-validation";
import { getStorageDriver } from "@/lib/storage";
import type { StorageDriver } from "@/lib/storage/driver";
import { isBlobConfigured, readBlob, streamBlobForRequest } from "@/lib/storage/blob";
import { getS3Object, isS3Configured } from "@/lib/storage/s3";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

function pdfNotFound(body: Record<string, unknown>) {
  return NextResponse.json(body, { status: 404 });
}

async function serveFromBlob(pdfKey: string, request: Request) {
  if (!isBlobConfigured()) {
    return null;
  }

  if (request.headers.get("range")) {
    const streamed = await streamBlobForRequest(pdfKey, request);
    if (streamed) {
      return streamed;
    }
  }

  const blobFile = await readBlob(pdfKey);
  if (!blobFile || !isValidPdfBuffer(blobFile)) {
    return null;
  }

  return pdfRangeResponse(blobFile, request);
}

async function serveFromS3(pdfKey: string, request: Request) {
  if (!isS3Configured()) {
    return null;
  }

  const file = await getS3Object(pdfKey);
  if (!file || !isValidPdfBuffer(file)) {
    return null;
  }

  return pdfRangeResponse(file, request);
}

async function serveFromDriver(
  driver: StorageDriver,
  pdfKey: string,
  request: Request,
) {
  if (driver === "local") {
    return pdfRangeFromLocalKey(pdfKey, request);
  }

  if (driver === "blob") {
    return serveFromBlob(pdfKey, request);
  }

  if (driver === "s3") {
    return serveFromS3(pdfKey, request);
  }

  return null;
}

async function servePdf(pdfKey: string, request: Request) {
  const local = await pdfRangeFromLocalKey(pdfKey, request);
  if (local) {
    return local;
  }

  const primary = getStorageDriver();
  const drivers: StorageDriver[] = [primary];
  for (const driver of ["local", "blob", "s3"] as const) {
    if (!drivers.includes(driver)) {
      drivers.push(driver);
    }
  }

  for (const driver of drivers) {
    if (driver === "local") {
      continue;
    }
    const response = await serveFromDriver(driver, pdfKey, request);
    if (response) {
      return response;
    }
  }

  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId: rawBookId } = await context.params;
  const bookId = resolveBookId(decodeURIComponent(rawBookId));
  const pdfKey = await getPublishedBookPdfKey(bookId);

  if (!pdfKey) {
    return pdfNotFound({
      error: "book_not_found",
      bookId,
    });
  }

  const driver = getStorageDriver();
  const response = await servePdf(pdfKey, request);
  if (!response) {
    return pdfNotFound({
      error: "pdf_not_in_storage",
      bookId,
      pdfKey,
      driver,
      blobConfigured: isBlobConfigured(),
      hint:
        process.env.VERCEL === "1" && driver !== "blob"
          ? "Set BLOB_READ_WRITE_TOKEN on this Vercel project (Storage → your Blob store → Connect), then redeploy."
          : "Upload the PDF to Blob with: npx tsx scripts/sync-storage-to-db.ts --files-only",
    });
  }

  return response;
}
