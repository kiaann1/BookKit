import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { togglePostLike } from "@/lib/social/posts";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await togglePostLike(id, auth.userId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
