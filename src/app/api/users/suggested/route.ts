import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getSuggestedUsers } from "@/lib/social/suggested-users";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getSuggestedUsers(auth.userId);
  return NextResponse.json({ users });
}
