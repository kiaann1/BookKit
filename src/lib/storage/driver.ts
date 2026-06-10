import { isBlobConfigured } from "@/lib/storage/blob";
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

  if (isBlobConfigured()) {
    return "blob";
  }

  if (isS3Configured()) {
    return "s3";
  }

  return "local";
}
