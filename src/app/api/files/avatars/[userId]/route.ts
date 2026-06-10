import { NextResponse } from "next/server";
import {
  avatarContentType,
  readStoredAvatar,
} from "@/lib/storage/avatar";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const avatar = await readStoredAvatar(userId);

  if (!avatar) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(avatar.bytes), {
    headers: {
      "Content-Type": avatarContentType(avatar.extension),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
