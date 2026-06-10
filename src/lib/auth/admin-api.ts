import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { resolveAdminRole } from "@/lib/auth/admin-role";
import { getSession } from "@/lib/session";

export async function assertAdminApi() {
  const session = await getSession();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = await resolveAdminRole(session.user.id, session.user.role);
  if (role !== UserRole.ADMIN) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, userId: session.user.id };
}
