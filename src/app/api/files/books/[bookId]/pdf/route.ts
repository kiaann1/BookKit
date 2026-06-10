import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getPublishedBookPdfKey } from "@/lib/books/pdf";
import { pdfRangeFromLocalKey } from "@/lib/files/pdf-range-local";
import { getStorageDriver } from "@/lib/storage";
import { streamBlobForRequest } from "@/lib/storage/blob";
import { getS3SignedUrl } from "@/lib/storage/s3";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId: rawBookId } = await context.params;
  const bookId = decodeURIComponent(rawBookId);
  const pdfKey = await getPublishedBookPdfKey(bookId);

  if (!pdfKey) {
    return new NextResponse(null, { status: 404 });
  }

  const driver = getStorageDriver();

  if (driver === "s3") {
    const url = await getS3SignedUrl(pdfKey, 3600);
    return NextResponse.redirect(url);
  }

  if (driver === "blob") {
    const streamed = await streamBlobForRequest(pdfKey, request);
    if (streamed) {
      return streamed;
    }
    return new NextResponse(null, { status: 404 });
  }

  const local = await pdfRangeFromLocalKey(pdfKey, request);
  if (local) {
    return local;
  }

  return new NextResponse(null, { status: 404 });
}
