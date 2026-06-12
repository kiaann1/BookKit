import { createReadStream } from "fs";
import { open } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Readable } from "stream";

function pdfResponseHeaders(fileSize: number, extra?: Record<string, string>) {
  return {
    "Content-Type": "application/pdf",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    Vary: "Range",
    ...extra,
  };
}

export async function pdfRangeFromLocalKey(key: string, request: Request) {
  const filePath = path.join(process.cwd(), "storage", key);
  let handle;

  try {
    handle = await open(filePath, "r");
  } catch {
    return null;
  }

  try {
    const stat = await handle.stat();
    const fileSize = stat.size;
    const range = request.headers.get("range");

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${fileSize}` },
          });
        }

        const length = end - start + 1;
        const buffer = Buffer.alloc(length);
        await handle.read(buffer, 0, length, start);

        return new NextResponse(new Uint8Array(buffer), {
          status: 206,
          headers: pdfResponseHeaders(fileSize, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": String(length),
          }),
        });
      }
    }

    await handle.close();
    handle = null;

    const stream = createReadStream(filePath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: pdfResponseHeaders(fileSize, {
        "Content-Length": String(fileSize),
      }),
    });
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}
