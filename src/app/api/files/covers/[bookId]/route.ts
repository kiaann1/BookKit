import { getBookCoverSource } from "@/lib/books/cover-source";
import { resolveExternalCoverUrl } from "@/lib/covers/resolve";
import { NextResponse } from "next/server";
import { getPublicFileUrl, getStorageDriver, readFile } from "@/lib/storage";
import { getS3SignedUrl } from "@/lib/storage/s3";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

async function serveStoredCover(coverKey: string) {
  const driver = getStorageDriver();

  if (driver === "blob") {
    const publicUrl = await getPublicFileUrl(coverKey);
    if (publicUrl) {
      return NextResponse.redirect(publicUrl);
    }
    return null;
  }

  if (driver === "s3") {
    const publicUrl =
      (await getPublicFileUrl(coverKey)) ??
      (await getS3SignedUrl(coverKey, 3600));
    if (publicUrl) {
      return NextResponse.redirect(publicUrl);
    }
    return null;
  }

  const file = await readFile(coverKey);
  if (!file) {
    return null;
  }

  const extension = coverKey.split(".").pop();
  const contentType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

async function serveExternalCover(title: string, author: string) {
  const externalUrl = await resolveExternalCoverUrl(title, author);
  if (!externalUrl) {
    return null;
  }

  let imageResponse: Response;
  try {
    imageResponse = await fetch(externalUrl, {
      headers: { Accept: "image/*" },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!imageResponse.ok) {
    return null;
  }

  const bytes = await imageResponse.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type":
        imageResponse.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { bookId: rawBookId } = await context.params;
  const bookId = decodeURIComponent(rawBookId);
  const book = await getBookCoverSource(bookId);

  if (!book) {
    return new NextResponse(null, { status: 404 });
  }

  if (book.coverKey) {
    const stored = await serveStoredCover(book.coverKey);
    if (stored) {
      return stored;
    }
  }

  const external = await serveExternalCover(book.title, book.author);
  if (external) {
    return external;
  }

  return new NextResponse(null, { status: 404 });
}
