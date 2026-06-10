import { getBookCoverSource } from "@/lib/books/cover-source";
import { resolveExternalCoverUrl } from "@/lib/covers/resolve";
import { NextResponse } from "next/server";
import { readFile } from "@/lib/storage";
import { getS3SignedUrl, isS3Configured } from "@/lib/storage/s3";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { bookId } = await context.params;
  const book = await getBookCoverSource(bookId);

  if (!book) {
    return new NextResponse(null, { status: 404 });
  }

  if (book.coverKey) {
    if (isS3Configured()) {
      const publicUrl = process.env.S3_PUBLIC_URL
        ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${book.coverKey}`
        : await getS3SignedUrl(book.coverKey, 3600);
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
