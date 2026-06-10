import { deleteLocal, readLocal, uploadLocal } from "@/lib/storage/local";
import {
  deleteS3,
  getS3PublicUrl,
  getS3SignedUrl,
  isS3Configured,
  uploadS3,
} from "@/lib/storage/s3";

export type StorageAccess = "public" | "private";

function s3Enabled() {
  return isS3Configured();
}

export async function uploadFile(options: {
  key: string;
  body: Buffer;
  contentType: string;
  access: StorageAccess;
}): Promise<void> {
  if (s3Enabled()) {
    await uploadS3(options.key, options.body, options.contentType, options.access);
    return;
  }
  await uploadLocal(options.key, options.body);
}

export async function readFile(key: string): Promise<Buffer | null> {
  if (s3Enabled()) {
    return null;
  }
  return readLocal(key);
}

export async function deleteFile(key: string): Promise<void> {
  if (s3Enabled()) {
    await deleteS3(key);
    return;
  }
  await deleteLocal(key);
}

export function getCoverUrl(bookId: string, coverKey: string | null) {
  if (!coverKey) {
    return null;
  }

  if (s3Enabled()) {
    const publicUrl = getS3PublicUrl(coverKey);
    if (publicUrl) {
      return publicUrl;
    }
  }

  return `/api/files/covers/${bookId}`;
}

export function getCoverApiUrl(bookId: string) {
  return `/api/files/covers/${bookId}`;
}

export async function getPrivateFileUrl(key: string) {
  if (s3Enabled()) {
    return getS3SignedUrl(key);
  }
  return `/api/files/private?key=${encodeURIComponent(key)}`;
}
