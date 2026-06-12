import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getUnreadMessageCount } from "@/lib/messages";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadCount = await getUnreadMessageCount(auth.userId);

  return NextResponse.json({ unreadCount });
}
