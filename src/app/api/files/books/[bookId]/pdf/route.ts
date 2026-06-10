import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getPublishedBookPdfKey } from "@/lib/books/pdf";
import { pdfRangeResponse } from "@/lib/files/pdf-response";
import { getStorageDriver, readFile } from "@/lib/storage";
import { getS3SignedUrl } from "@/lib/storage/s3";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await context.params;
  const pdfKey = await getPublishedBookPdfKey(bookId);

  if (!pdfKey) {
    return new NextResponse(null, { status: 404 });
  }

  if (getStorageDriver() === "s3") {
    const url = await getS3SignedUrl(pdfKey, 3600);
    return NextResponse.redirect(url);
  }

  const file = await readFile(pdfKey);
  if (!file) {
    return new NextResponse(null, { status: 404 });
  }

  return pdfRangeResponse(file, request);
}
