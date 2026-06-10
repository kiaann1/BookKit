import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { userAvatarKey } from "@/lib/storage/keys";

function findAvatarPath(userId: string) {
  for (const extension of ["jpg", "png", "webp"] as const) {
    const key = userAvatarKey(userId, extension);
    const fullPath = path.join(process.cwd(), "storage", key);
    if (existsSync(fullPath)) {
      return { fullPath, extension };
    }
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const avatar = findAvatarPath(userId);

  if (!avatar) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await import("fs/promises").then((fs) =>
    fs.readFile(avatar.fullPath),
  );

  const contentType =
    avatar.extension === "png"
      ? "image/png"
      : avatar.extension === "webp"
        ? "image/webp"
        : "image/jpeg";

  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
