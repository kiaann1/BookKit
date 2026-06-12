import { existsSync, readdirSync } from "fs";
import path from "path";
import { blobObjectExists } from "@/lib/storage/blob";
import { isS3Configured, s3ObjectExists } from "@/lib/storage/s3";

export function localFileExists(key: string) {
  const fullPath = path.join(process.cwd(), "storage", key);
  return existsSync(fullPath);
}

/** True when ./storage/books contains at least one original.pdf (local dev). */
export function hasLocalBookPdfs() {
  const root = path.join(process.cwd(), "storage", "books");
  if (!existsSync(root)) {
    return false;
  }

  try {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (existsSync(path.join(root, entry.name, "original.pdf"))) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/** Check local disk, then Blob, then S3 — for resolving which key actually has bytes. */
export async function fileExistsInAnyBackend(key: string): Promise<boolean> {
  if (localFileExists(key)) {
    return true;
  }

  if (await blobObjectExists(key)) {
    return true;
  }

  if (isS3Configured() && (await s3ObjectExists(key))) {
    return true;
  }

  return false;
}
