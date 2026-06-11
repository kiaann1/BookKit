import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import {
  blockUser,
  getBlockStatus,
  unblockUser,
} from "@/lib/social/block";
import { getUserIdByUsername } from "@/lib/social/follow";

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

  const status = await getBlockStatus(auth.userId, userId);
  return NextResponse.json(status);
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

  const result = await blockUser(auth.userId, userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath(`/u/${username}`);
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/people");

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

  const result = await unblockUser(auth.userId, userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath(`/u/${username}`);
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/people");

  return NextResponse.json({ success: true });
}
