import { existsSync } from "fs";
import path from "path";
import { resolveExternalCoverUrl } from "@/lib/covers/resolve";
import { bookCoverKey, coverExtensionFromMime } from "@/lib/storage/keys";
import { uploadFile } from "@/lib/storage";

export function findLocalCoverKey(bookId: string) {
  for (const extension of ["jpg", "png", "webp"] as const) {
    const key = bookCoverKey(bookId, extension);
    const fullPath = path.join(process.cwd(), "storage", key);
    if (existsSync(fullPath)) {
      return key;
    }
  }
  return null;
}

export async function ensureBookCover(
  bookId: string,
  title: string,
  author: string,
): Promise<string | null> {
  const existing = findLocalCoverKey(bookId);
  if (existing) {
    return existing;
  }

  const url = await resolveExternalCoverUrl(title, author);
  if (!url) {
    return null;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "image/*" },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const extension =
    coverExtensionFromMime(contentType.split(";")[0]?.trim() ?? "") ?? "jpg";
  const key = bookCoverKey(bookId, extension);
  const body = Buffer.from(await response.arrayBuffer());

  await uploadFile({
    key,
    body,
    contentType: contentType.split(";")[0]?.trim() ?? "image/jpeg",
    access: "public",
  });

  return key;
}
