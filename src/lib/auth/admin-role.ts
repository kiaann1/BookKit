import { UserRole } from "@prisma/client";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { isAuthDisabled } from "@/lib/dev-auth";

export async function resolveAdminRole(userId: string, sessionRole: UserRole) {
  if (isAuthDisabled()) {
    return sessionRole;
  }

  if (!(await isDatabaseAvailable())) {
    return sessionRole;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role ?? sessionRole;
  } catch {
    return sessionRole;
  }
}
