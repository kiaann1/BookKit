import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { enforceUserRateLimit } from "@/lib/security/rate-limit";
import { listConversations, sendMessage } from "@/lib/messages";
import { sendMessageSchema } from "@/lib/validations/message";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await listConversations(auth.userId);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceUserRateLimit(auth.userId, "send-message", {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await sendMessage(auth.userId, parsed.data);
  if ("error" in result) {
    const status =
      result.error === "User not found"
        ? 404
        : result.error === "Database unavailable"
          ? 503
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${result.conversationId}`);

  return NextResponse.json(result, { status: 201 });
}
