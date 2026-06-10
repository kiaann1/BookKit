import { getBookCoverSource } from "@/lib/books/cover-source";
import { resolveExternalCoverUrl } from "@/lib/covers/resolve";
import { NextResponse } from "next/server";
import { getPublicFileUrl, getStorageDriver, readFile } from "@/lib/storage";
import { getS3SignedUrl } from "@/lib/storage/s3";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { bookId: rawBookId } = await context.params;
  const bookId = decodeURIComponent(rawBookId);
  const book = await getBookCoverSource(bookId);

  if (!book) {
    return new NextResponse(null, { status: 404 });
  }

  if (book.coverKey) {
    const driver = getStorageDriver();

    if (driver === "blob") {
      const publicUrl = await getPublicFileUrl(book.coverKey);
      if (publicUrl) {
        return NextResponse.redirect(publicUrl);
      }
    }

    if (driver === "s3") {
      const publicUrl =
        (await getPublicFileUrl(book.coverKey)) ??
        (await getS3SignedUrl(book.coverKey, 3600));
      return NextResponse.redirect(publicUrl);
    }

    const file = await readFile(book.coverKey);
    if (!file) {
      return new NextResponse(null, { status: 404 });
    }

    const extension = book.coverKey.split(".").pop();
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

  const externalUrl = await resolveExternalCoverUrl(book.title, book.author);
  if (!externalUrl) {
    return new NextResponse(null, { status: 404 });
  }

  let imageResponse: Response;
  try {
    imageResponse = await fetch(externalUrl, {
      headers: { Accept: "image/*" },
      cache: "no-store",
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  if (!imageResponse.ok) {
    return new NextResponse(null, { status: 404 });
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
