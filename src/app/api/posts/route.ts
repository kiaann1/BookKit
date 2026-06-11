import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import {
  MAX_POST_IMAGE_BYTES,
  MAX_POST_VIDEO_BYTES,
} from "@/lib/constants/post-types";
import { createPost, getFeedPosts } from "@/lib/social/posts";
import { uploadFile } from "@/lib/storage";
import {
  isAllowedPostImage,
  isAllowedPostVideo,
  mediaKeyForPost,
  resolveImageExtension,
  resolveVideoExtension,
} from "@/lib/storage/post-media";
import {
  createPostSchema,
  feedQuerySchema,
  parseCreatePostForm,
} from "@/lib/validations/post";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = feedQuerySchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const feed = await getFeedPosts(auth.userId, parsed.data);
  return NextResponse.json(feed);
}

async function handleJsonPost(request: Request, userId: string) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normalizedBody =
    typeof body === "object" &&
    body !== null &&
    !("type" in body)
      ? { ...(body as Record<string, unknown>), type: "TEXT" }
      : body;

  const parsed = createPostSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (parsed.data.type !== "TEXT" && parsed.data.type !== "ARTICLE") {
    return NextResponse.json(
      { error: "Use multipart upload for image and video posts." },
      { status: 400 },
    );
  }

  const result = await createPost(userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/feed");
  return NextResponse.json(result, { status: 201 });
}

async function handleMultipartPost(request: Request, userId: string) {
  const formData = await request.formData();
  const parsed = parseCreatePostForm(formData);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const mediaFile = formData.get("media");
  let mediaKey: string | null = null;

  if (parsed.data.type === "IMAGE") {
    if (!(mediaFile instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }
    if (!isAllowedPostImage(mediaFile)) {
      return NextResponse.json(
        { error: "Image must be JPG, PNG, WebP, or GIF" },
        { status: 400 },
      );
    }
    if (mediaFile.size > MAX_POST_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5 MB or smaller" },
        { status: 400 },
      );
    }
  }

  if (parsed.data.type === "VIDEO") {
    if (!(mediaFile instanceof File)) {
      return NextResponse.json({ error: "Video file is required" }, { status: 400 });
    }
    if (!isAllowedPostVideo(mediaFile)) {
      return NextResponse.json(
        { error: "Video must be MP4 or WebM" },
        { status: 400 },
      );
    }
    if (mediaFile.size > MAX_POST_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "Video must be 50 MB or smaller" },
        { status: 400 },
      );
    }
  }

  const draft = await createPost(userId, {
    ...parsed.data,
    mediaKey: null,
  });

  if ("error" in draft) {
    return NextResponse.json({ error: draft.error }, { status: 400 });
  }

  if (
    (parsed.data.type === "IMAGE" || parsed.data.type === "VIDEO") &&
    mediaFile instanceof File
  ) {
    const extension =
      parsed.data.type === "IMAGE"
        ? resolveImageExtension(mediaFile)
        : resolveVideoExtension(mediaFile);

    if (!extension) {
      return NextResponse.json({ error: "Unsupported media file" }, { status: 400 });
    }

    mediaKey = mediaKeyForPost(draft.postId, extension);
    const bytes = Buffer.from(await mediaFile.arrayBuffer());
    await uploadFile({
      key: mediaKey,
      body: bytes,
      contentType: mediaFile.type || "application/octet-stream",
      access: "private",
    });

    const { prisma } = await import("@/lib/db");
    await prisma.post.update({
      where: { id: draft.postId },
      data: { mediaKey },
    });
  }

  revalidatePath("/feed");
  return NextResponse.json({ postId: draft.postId }, { status: 201 });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleMultipartPost(request, auth.userId);
  }

  return handleJsonPost(request, auth.userId);
}
