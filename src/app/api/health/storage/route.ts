import { NextResponse } from "next/server";
import { getPublishedBookPdfKey } from "@/lib/books/pdf";
import { getStorageDriver } from "@/lib/storage";
import { isBlobConfigured, readBlob } from "@/lib/storage/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SAMPLE_BOOK_ID = "hekate--nikita-gill";

export async function GET() {
  const driver = getStorageDriver();
  const blobConfigured = isBlobConfigured();
  const onVercel = process.env.VERCEL === "1";

  let pdfKey: string | null = null;
  try {
    pdfKey = await getPublishedBookPdfKey(SAMPLE_BOOK_ID);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      driver,
      blobConfigured,
      onVercel,
      error: error instanceof Error ? error.message : "pdfKey lookup failed",
    });
  }

  let blobReadable = false;
  if (pdfKey && driver === "blob") {
    const bytes = await readBlob(pdfKey);
    blobReadable = bytes !== null && bytes.byteLength > 0;
  }

  const ok = driver === "blob" && blobConfigured && blobReadable;

  return NextResponse.json({
    ok,
    driver,
    blobConfigured,
    onVercel,
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
    storageDriverEnv: process.env.STORAGE_DRIVER ?? null,
    sampleBookId: SAMPLE_BOOK_ID,
    samplePdfKey: pdfKey,
    sampleBlobReadable: blobReadable,
    hint: !blobConfigured
      ? "Add BLOB_READ_WRITE_TOKEN (and BLOB_STORE_ID) in Vercel → Settings → Environment Variables, then redeploy."
      : driver !== "blob"
        ? "Storage driver is not blob — unset STORAGE_DRIVER=local on Vercel or add Blob env vars."
        : !blobReadable
          ? "Blob is configured but the sample PDF could not be read. Check the file was uploaded to the same Blob store linked to this project."
          : undefined,
  });
}
