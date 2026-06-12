import { isBlobConfigured } from "@/lib/storage/blob";
import { hasLocalBookPdfs } from "@/lib/storage/resolve";
import { isS3Configured } from "@/lib/storage/s3";

export type StorageDriver = "blob" | "s3" | "local";

export function getStorageDriver(): StorageDriver {
  const preferred = process.env.STORAGE_DRIVER?.toLowerCase();

  if (preferred === "s3" && isS3Configured()) {
    return "s3";
  }

  if (preferred === "blob" && isBlobConfigured()) {
    return "blob";
  }

  if (preferred === "local") {
    return "local";
  }

  // After `vercel env pull`, Blob tokens are present locally but PDFs often live on disk.
  if (process.env.VERCEL !== "1" && hasLocalBookPdfs()) {
    return "local";
  }

  if (isBlobConfigured()) {
    return "blob";
  }

  if (isS3Configured()) {
    return "s3";
  }

  return "local";
}
