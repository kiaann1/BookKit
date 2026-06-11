import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import {
  createBookRequest,
  getPopularBookRequests,
  getUserBookRequests,
} from "@/lib/book-requests";
import { enforceUserRateLimit } from "@/lib/security/rate-limit";
import { parseCreateBookRequestBody } from "@/lib/validations/book-request";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [mine, popular] = await Promise.all([
    getUserBookRequests(auth.userId),
    getPopularBookRequests(auth.userId),
  ]);

  return NextResponse.json({ mine, popular });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceUserRateLimit(auth.userId, "book-request", {
    limit: 10,
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

  const parsed = parseCreateBookRequestBody(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await createBookRequest(auth.userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  revalidatePath("/requests");
  revalidatePath("/admin/requests");

  return NextResponse.json(result, { status: 201 });
}
