import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import {
  followUser,
  getFollowCounts,
  getUserIdByUsername,
  isFollowing,
  unfollowUser,
} from "@/lib/social/follow";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await context.params;
  const userId = await getUserIdByUsername(username);

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [followCounts, following] = await Promise.all([
    getFollowCounts(userId),
    isFollowing(auth.userId, userId),
  ]);

  return NextResponse.json({
    followCounts,
    isFollowing: following,
    isSelf: userId === auth.userId,
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await context.params;
  const userId = await getUserIdByUsername(username);

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await followUser(auth.userId, userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath(`/u/${username}`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await context.params;
  const userId = await getUserIdByUsername(username);

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await unfollowUser(auth.userId, userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath(`/u/${username}`);
  return NextResponse.json({ success: true });
}
