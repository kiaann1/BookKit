import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { resolveAdminRole } from "@/lib/auth/admin-role";
import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/books");
  }

  const role = await resolveAdminRole(session.user.id, session.user.role);
  if (role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return session;
}

export async function isAdmin() {
  const session = await getSession();
  if (!session?.user) {
    return false;
  }

  const role = await resolveAdminRole(session.user.id, session.user.role);
  return role === UserRole.ADMIN;
}
