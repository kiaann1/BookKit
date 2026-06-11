import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { toggleBookRequestVote } from "@/lib/book-requests";
import { enforceUserRateLimit } from "@/lib/security/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceUserRateLimit(auth.userId, "book-request-vote", {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  const { id } = await context.params;
  const result = await toggleBookRequestVote(id, auth.userId);

  if ("error" in result) {
    const status = result.error === "Request not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
