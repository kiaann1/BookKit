import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { isDatabaseAvailable } from "@/lib/db/health";
import { searchUsers } from "@/lib/social/search-users";

const querySchema = z.object({
  q: z.string().trim().min(2).max(30),
  limit: z.coerce.number().int().min(1).max(20).optional().default(12),
});

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "User search requires a database connection." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const users = await searchUsers(parsed.data.q, auth.userId, {
    limit: parsed.data.limit,
  });

  return NextResponse.json({ users });
}
