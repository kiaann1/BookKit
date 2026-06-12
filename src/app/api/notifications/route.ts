import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "@/lib/notifications";
import {
  markNotificationsReadSchema,
  notificationsQuerySchema,
} from "@/lib/validations/notification";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = notificationsQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(auth.userId, parsed.data),
    getUnreadNotificationCount(auth.userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
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

  const parsed = markNotificationsReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await markNotificationsRead(auth.userId, parsed.data);
  return NextResponse.json(result);
}
