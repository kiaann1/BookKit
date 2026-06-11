import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { enforceUserRateLimit } from "@/lib/security/rate-limit";
import { deleteUserAccount } from "@/lib/user/delete-account";
import { deleteAccountSchema } from "@/lib/validations/user";

export async function DELETE(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceUserRateLimit(auth.userId, "delete-account", {
    limit: 5,
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

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await deleteUserAccount(auth.userId, parsed.data.password);
  if ("error" in result) {
    const status =
      result.error === "Incorrect password"
        ? 401
        : result.error === "Admin accounts cannot be self-deleted. Contact support."
          ? 403
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true });
}
