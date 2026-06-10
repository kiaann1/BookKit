import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { resolveBookId } from "@/lib/books/paths";
import { getPublishedBookPdfKey } from "@/lib/books/pdf";
import { pdfRangeFromLocalKey } from "@/lib/files/pdf-range-local";
import { pdfRangeResponse } from "@/lib/files/pdf-response";
import { getStorageDriver, readFile } from "@/lib/storage";
import { isBlobConfigured, streamBlobForRequest } from "@/lib/storage/blob";
import { getS3SignedUrl } from "@/lib/storage/s3";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

function pdfNotFound(body: Record<string, unknown>) {
  return NextResponse.json(body, { status: 404 });
}

async function servePdf(pdfKey: string, request: Request) {
  const driver = getStorageDriver();

  if (driver === "s3") {
    const url = await getS3SignedUrl(pdfKey, 3600);
    return NextResponse.redirect(url);
  }

  if (driver === "blob") {
    const blobFile = await readFile(pdfKey);
    if (blobFile) {
      return pdfRangeResponse(blobFile, request);
    }

    const streamed = await streamBlobForRequest(pdfKey, request);
    if (streamed) {
      return streamed;
    }
  }

  const local = await pdfRangeFromLocalKey(pdfKey, request);
  if (local) {
    return local;
  }

  const file = await readFile(pdfKey);
  if (file) {
    return pdfRangeResponse(file, request);
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
