import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/db";
import {
  coverExtensionFromMime,
  userAvatarKey,
} from "@/lib/storage/keys";
import { uploadFile } from "@/lib/storage";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Avatar file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 2MB" }, { status: 400 });
  }

  const extension = coverExtensionFromMime(file.type) ?? "jpg";
  const key = userAvatarKey(auth.userId, extension);
  const body = Buffer.from(await file.arrayBuffer());

  await uploadFile({
    key,
    body,
    contentType: file.type,
    access: "public",
  });

  const avatarUrl = `/api/files/avatars/${auth.userId}`;

  await prisma.user.update({
    where: { id: auth.userId },
    data: { avatarUrl },
  });

  return NextResponse.json({ avatarUrl });
}
