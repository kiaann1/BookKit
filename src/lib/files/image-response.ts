import { NextResponse } from "next/server";

export function imageContentType(key: string) {
  const extension = key.split(".").pop()?.toLowerCase();
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }
  return "image/jpeg";
}

export function imageBytesResponse(
  bytes: Buffer | Uint8Array,
  options: { contentType: string; cacheControl?: string },
) {
  const body = bytes instanceof Buffer ? new Uint8Array(bytes) : bytes;
  return new NextResponse(body as BodyInit, {
    headers: {
      "Content-Type": options.contentType,
      "Cache-Control": options.cacheControl ?? "public, max-age=86400, immutable",
    },
  });
}
