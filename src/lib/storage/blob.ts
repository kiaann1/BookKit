import { del, get, list, put } from "@vercel/blob";

export function isBlobConfigured() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return true;
  }

  // On Vercel, linked Blob stores authenticate via OIDC (no static token required).
  if (process.env.VERCEL === "1") {
    return Boolean(process.env.BLOB_STORE_ID || process.env.VERCEL_OIDC_TOKEN);
  }

  return false;
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

function blobUploadAccess(requested: "public" | "private"): "public" | "private" {
  if (process.env.BLOB_STORE_ACCESS === "public") {
    return requested;
  }
  // Private Blob stores reject `access: "public"`; files are served through our API.
  return "private";
}

export type BlobUploadOptions = {
  onProgress?: (loaded: number, total: number) => void;
};

export async function uploadBlob(
  key: string,
  body: Buffer,
  contentType: string,
  access: "public" | "private",
  options: BlobUploadOptions = {},
): Promise<{ url: string }> {
  const useMultipart =
    process.env.BLOB_DISABLE_MULTIPART !== "true" &&
    body.byteLength > 20 * 1024 * 1024;

  const result = await put(normalizeKey(key), body, {
    access: blobUploadAccess(access),
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: useMultipart,
    onUploadProgress: options.onProgress
      ? (event) => {
          options.onProgress?.(
            event.loaded,
            event.total ?? body.byteLength,
          );
        }
      : undefined,
  });

  return { url: result.url };
}

async function readBlobWithAccess(
  key: string,
  access: "private" | "public",
): Promise<Buffer | null> {
  const pathname = normalizeKey(key);

  try {
    const result = await get(pathname, { access });
    if (result?.statusCode !== 200 || !result.stream) {
      return null;
    }

    return Buffer.from(await new Response(result.stream).arrayBuffer());
  } catch {
    return null;
  }
}

export async function readBlob(key: string): Promise<Buffer | null> {
  if (!isBlobConfigured()) {
    return null;
  }

  const fromPrivate = await readBlobWithAccess(key, "private");
  if (fromPrivate) {
    return fromPrivate;
  }

  return readBlobWithAccess(key, "public");
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

/** Stream a blob through range requests without buffering the full file on the server. */
export async function streamBlobForRequest(
  key: string,
  request: Request,
): Promise<Response | null> {
  if (!isBlobConfigured()) {
    return null;
  }

  const pathname = normalizeKey(key);
  const range = request.headers.get("range");
  const extraHeaders: HeadersInit = range ? { Range: range } : {};

  for (const access of ["private", "public"] as const) {
    try {
      const result = await get(pathname, { access, headers: extraHeaders });
      if (!result?.stream) {
        continue;
      }

      const headers: Record<string, string> = {};
      result.headers.forEach((value, name) => {
        headers[name] = value;
      });
      if (!headers["content-type"]) {
        headers["Content-Type"] = "application/pdf";
      }
      headers["Accept-Ranges"] = "bytes";
      headers["Cache-Control"] = "private, max-age=300";

      return new Response(result.stream, {
        status: result.statusCode,
        headers,
      });
    } catch {
      continue;
    }
  }

  return null;
}
