import { del, list, put } from "@vercel/blob";

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "");
}

async function findBlobByKey(key: string) {
  const normalized = normalizeKey(key);
  const { blobs } = await list({ prefix: normalized, limit: 20 });

  return (
    blobs.find(
      (blob) =>
        normalizeKey(blob.pathname) === normalized ||
        blob.pathname === `/${normalized}`,
    ) ?? null
  );
}

export async function blobObjectExists(key: string) {
  if (!isBlobConfigured()) {
    return false;
  }

  const blob = await findBlobByKey(key);
  return blob !== null;
}

export async function uploadBlob(
  key: string,
  body: Buffer,
  contentType: string,
  access: "public" | "private",
): Promise<{ url: string }> {
  const result = await put(normalizeKey(key), body, {
    access,
    contentType,
    addRandomSuffix: false,
  });

  return { url: result.url };
}

export async function readBlob(key: string): Promise<Buffer | null> {
  const blob = await findBlobByKey(key);
  if (!blob) {
    return null;
  }

  const response = await fetch(blob.url);
  if (!response.ok) {
    return null;
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function deleteBlob(key: string): Promise<void> {
  const blob = await findBlobByKey(key);
  if (!blob) {
    return;
  }

  await del(blob.url);
}

export async function getBlobPublicUrl(key: string): Promise<string | null> {
  const blob = await findBlobByKey(key);
  return blob?.url ?? null;
}
