import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getFollowingList } from "@/lib/social/follow-lists";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await context.params;
  const result = await getFollowingList(username, auth.userId);

  if ("error" in result) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (result.error === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  return NextResponse.json({ users: result.users });
}
