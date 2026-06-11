import { compare } from "bcryptjs";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";

export async function deleteUserAccount(userId: string, password: string) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, role: true },
  });

  if (!user?.passwordHash) {
    return { error: "Account cannot be deleted" as const };
  }

  const isValid = await compare(password, user.passwordHash);
  if (!isValid) {
    return { error: "Incorrect password" as const };
  }

  if (user.role === "ADMIN") {
    return {
      error: "Admin accounts cannot be self-deleted. Contact support." as const,
    };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true as const };
}
