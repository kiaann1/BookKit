import { NextResponse } from "next/server";
import { getBookDiscussion } from "@/lib/books/discussion";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getPostsByBookId } from "@/lib/social/posts";
import { feedQuerySchema } from "@/lib/validations/post";

type RouteContext = { params: Promise<{ bookId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await context.params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  if (cursor) {
    const parsed = feedQuerySchema.safeParse({
      cursor,
      limit: searchParams.get("limit") ?? "10",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const posts = await getPostsByBookId(bookId, auth.userId, parsed.data);
    return NextResponse.json(posts);
  }

  const discussion = await getBookDiscussion(bookId, auth.userId);
  return NextResponse.json(discussion);
}
