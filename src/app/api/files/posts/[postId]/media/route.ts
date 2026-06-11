import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/db";
import { isDatabaseAvailable } from "@/lib/db/health";
import { readStoredPostMedia } from "@/lib/storage/post-media";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return new NextResponse(null, { status: 503 });
  }

  const { postId } = await params;
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { mediaKey: true, userId: true },
  });

  if (!post?.mediaKey) {
    return new NextResponse(null, { status: 404 });
  }

  const media = await readStoredPostMedia(postId, post.mediaKey);
  if (!media) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
