import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import {
  deleteStoredAvatars,
  isAllowedAvatarFile,
  resolveAvatarExtension,
} from "@/lib/storage/avatar";
import { MAX_AVATAR_BYTES } from "@/lib/images/prepare-avatar";
import { deleteFile, uploadFile } from "@/lib/storage";
import { userAvatarKey } from "@/lib/storage/keys";
const AVATAR_EXTENSIONS = ["jpg", "png", "webp"] as const;

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Avatar file is required" },
        { status: 400 },
      );
    }

    if (!isAllowedAvatarFile(file)) {
      return NextResponse.json(
        { error: "File must be a JPG, PNG, or WebP image" },
        { status: 400 },
      );
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        {
          error:
            "Image is still too large after resizing. Try a different photo.",
        },
        { status: 400 },
      );
    }

    const extension = resolveAvatarExtension(file);
    const key = userAvatarKey(auth.userId, extension);
    const body = Buffer.from(await file.arrayBuffer());
    const contentType =
      file.type && file.type.startsWith("image/")
        ? file.type
        : extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg";

    const uploadResult = await uploadFile({
      key,
      body,
      contentType,
      access: "public",
    });

    await Promise.all(
      AVATAR_EXTENSIONS.filter((value) => value !== extension).map((value) =>
        deleteFile(userAvatarKey(auth.userId, value)),
      ),
    );

    const avatarUrl =
      uploadResult.publicUrl ?? `/api/files/avatars/${auth.userId}`;

    if (await isDatabaseAvailable()) {
      try {
        await prisma.user.update({
          where: { id: auth.userId },
          data: { avatarUrl },
        });
      } catch (error) {
        console.error("[avatar] Saved file but could not update user:", error);
      }
    }

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("[avatar] Upload failed:", error);
    return NextResponse.json(
      {
        error:
          "Could not save your photo. Try a JPG or PNG, then try again.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteStoredAvatars(auth.userId);

    if (await isDatabaseAvailable()) {
      try {
        await prisma.user.update({
          where: { id: auth.userId },
          data: { avatarUrl: null },
        });
      } catch (error) {
        console.error("[avatar] Removed file but could not update user:", error);
      }
    }

    return NextResponse.json({ avatarUrl: null });
  } catch (error) {
    console.error("[avatar] Delete failed:", error);
    return NextResponse.json(
      { error: "Could not remove your photo. Please try again." },
      { status: 500 },
    );
  }
}
