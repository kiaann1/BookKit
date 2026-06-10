import {
  blobObjectExists,
  deleteBlob,
  getBlobPublicUrl,
  isBlobConfigured,
  readBlob,
  uploadBlob,
} from "@/lib/storage/blob";
import { getStorageDriver } from "@/lib/storage/driver";
import { deleteLocal, readLocal, uploadLocal } from "@/lib/storage/local";
import {
  deleteS3,
  getS3PublicUrl,
  getS3SignedUrl,
  isS3Configured,
  getS3Object,
  s3ObjectExists,
  uploadS3,
} from "@/lib/storage/s3";
import { existsSync } from "fs";
import path from "path";

export type StorageAccess = "public" | "private";

export type UploadResult = {
  /** Direct public URL when the driver provides one (e.g. Vercel Blob). */
  publicUrl?: string;
};

export async function fileExists(key: string): Promise<boolean> {
  const driver = getStorageDriver();

  if (driver === "blob") {
    return blobObjectExists(key);
  }

  if (driver === "s3") {
    return s3ObjectExists(key);
  }

  const fullPath = path.join(process.cwd(), "storage", key);
  return existsSync(fullPath);
}

export async function uploadFile(options: {
  key: string;
  body: Buffer;
  contentType: string;
  access: StorageAccess;
}): Promise<UploadResult> {
  const driver = getStorageDriver();

  if (driver === "blob") {
    const result = await uploadBlob(
      options.key,
      options.body,
      options.contentType,
      options.access,
    );
    return { publicUrl: result.url };
  }

  if (driver === "s3") {
    await uploadS3(
      options.key,
      options.body,
      options.contentType,
      options.access,
    );
    const publicUrl = getS3PublicUrl(options.key);
    return publicUrl ? { publicUrl } : {};
  }

  await uploadLocal(options.key, options.body);
  return {};
}

export async function readFile(key: string): Promise<Buffer | null> {
  const driver = getStorageDriver();

  if (driver === "blob") {
    return readBlob(key);
  }

  if (driver === "s3") {
    return getS3Object(key);
  }

  return readLocal(key);
}

export async function deleteFile(key: string): Promise<void> {
  const driver = getStorageDriver();

  if (driver === "blob") {
    await deleteBlob(key);
    return;
  }

  if (driver === "s3") {
    await deleteS3(key);
    return;
  }

  await deleteLocal(key);
}

export async function getPublicFileUrl(key: string): Promise<string | null> {
  const driver = getStorageDriver();

  if (driver === "blob") {
    return getBlobPublicUrl(key);
  }

  if (driver === "s3") {
    return getS3PublicUrl(key);
  }

  return null;
}

export function getCoverUrl(bookId: string, coverKey: string | null) {
  if (!coverKey) {
    return null;
  }

  const driver = getStorageDriver();

  if (driver === "s3") {
    const publicUrl = getS3PublicUrl(coverKey);
    if (publicUrl) {
      return publicUrl;
    }
  }

  return getCoverApiUrl(bookId);
}

export function getCoverApiUrl(bookId: string) {
  return `/api/files/covers/${encodeURIComponent(bookId)}`;
}

export async function getPrivateFileUrl(key: string) {
  const driver = getStorageDriver();

  if (driver === "blob") {
    const publicUrl = await getBlobPublicUrl(key);
    if (publicUrl) {
      return publicUrl;
    }
  }

  if (driver === "s3") {
    return getS3SignedUrl(key);
  }

  return `/api/files/private?key=${encodeURIComponent(key)}`;
}

export { getStorageDriver, isBlobConfigured, isS3Configured };
