import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/books");
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return session;
}

export async function isAdmin() {
  const session = await getSession();
  return session?.user?.role === UserRole.ADMIN;
}
