import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { enforceUserRateLimit } from "@/lib/security/rate-limit";
import { getUserIdByUsername } from "@/lib/social/follow";
import { reportUser } from "@/lib/social/report-user";
import { reportUserSchema } from "@/lib/validations/user-moderation";

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceUserRateLimit(auth.userId, "report-user", {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  const { username } = await context.params;
  const userId = await getUserIdByUsername(username);

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reportUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await reportUser(
    userId,
    auth.userId,
    parsed.data.reason,
    parsed.data.details,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
