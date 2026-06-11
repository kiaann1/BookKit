import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { sanitizeOptionalPlainText } from "@/lib/security/sanitize";

export async function reportUser(
  reportedUserId: string,
  reporterId: string,
  reason: string,
  details?: string | null,
) {
  if (reportedUserId === reporterId) {
    return { error: "You cannot report yourself" as const };
  }

  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: reportedUserId },
    select: { id: true },
  });

  if (!user) {
    return { error: "User not found" as const };
  }

  const storedReason = sanitizeOptionalPlainText(
    details?.trim() ? `${reason}: ${details.trim()}` : reason,
    { maxLength: 500 },
  );

  await prisma.userReport.upsert({
    where: {
      reporterId_reportedUserId: {
        reporterId,
        reportedUserId,
      },
    },
    create: {
      reporterId,
      reportedUserId,
      reason: storedReason,
    },
    update: {
      reason: storedReason,
    },
  });

  return { success: true as const };
}
