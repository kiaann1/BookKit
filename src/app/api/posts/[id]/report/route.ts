import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { enforceUserRateLimit } from "@/lib/security/rate-limit";
import { reportPost } from "@/lib/social/posts";
import { reportPostSchema } from "@/lib/validations/post";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const limited = enforceUserRateLimit(auth.userId, "report-post", {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // optional body
  }

  const parsed = reportPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await reportPost(
    id,
    auth.userId,
    parsed.data.reason,
    parsed.data.details,
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
