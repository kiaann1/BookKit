import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { getAdminBookRequests } from "@/lib/book-requests";
import { adminBookRequestQuerySchema } from "@/lib/validations/book-request";

export async function GET(request: Request) {
  const auth = await assertAdminApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const parsed = adminBookRequestQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const requests = await getAdminBookRequests(parsed.data);
  return NextResponse.json({ requests });
}
