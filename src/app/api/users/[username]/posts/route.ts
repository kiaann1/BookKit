import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getUserIdByUsername } from "@/lib/social/follow";
import { getUserPosts } from "@/lib/social/posts";
import { feedQuerySchema } from "@/lib/validations/post";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await context.params;
  const userId = await getUserIdByUsername(username);

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  const feed = await getUserPosts(username, auth.userId, parsed.data);
  return NextResponse.json(feed);
}
