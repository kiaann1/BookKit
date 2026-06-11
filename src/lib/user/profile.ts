import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { resolveAvatarUrl } from "@/lib/storage/avatar";
import { getShelfStatusCounts, getShowcaseBooks } from "@/lib/shelf";

export async function getUserProfile(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
        genrePreferences: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    const [showcase, shelfStats] = await Promise.all([
      getShowcaseBooks(userId),
      getShelfStatusCounts(userId),
    ]);

    return {
      ...user,
      avatarUrl: resolveAvatarUrl(user.id, user.avatarUrl),
      showcase,
      shelfStats,
    };
  } catch {
    return null;
  }
}
