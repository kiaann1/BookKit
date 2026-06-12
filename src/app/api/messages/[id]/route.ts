import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import {
  getConversationForUser,
  getMessages,
  markConversationRead,
} from "@/lib/messages";
import {
  getMessagesAfter,
  getOtherUserTyping,
} from "@/lib/messages/realtime";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const after = new URL(request.url).searchParams.get("after");
  const incremental = Boolean(after);

  const [conversation, messages, typingActive] = await Promise.all([
    incremental ? Promise.resolve(null) : getConversationForUser(id, auth.userId),
    incremental
      ? getMessagesAfter(id, auth.userId, after!)
      : getMessages(id, auth.userId),
    getOtherUserTyping(id, auth.userId),
  ]);

  if (messages === null) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (!incremental && !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...(conversation ? { conversation } : {}),
    messages,
    typing: { active: typingActive },
  });
}

export async function PATCH(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await markConversationRead(id, auth.userId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
