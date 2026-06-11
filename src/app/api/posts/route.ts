import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { createPost, getFeedPosts } from "@/lib/social/posts";
import { createPostSchema, feedQuerySchema } from "@/lib/validations/post";

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

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await createPost(auth.userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/feed");
  return NextResponse.json(result, { status: 201 });
}
