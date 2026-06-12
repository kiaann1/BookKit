import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { getBlockedUserIds } from "@/lib/social/block";
import { getFollowingIds } from "@/lib/social/follow";
import { mapSocialAuthor } from "@/lib/social/map";
import type { UserSearchResult } from "@/lib/social/types";

export async function getSuggestedUsers(
  viewerId: string,
  options?: { limit?: number },
): Promise<UserSearchResult[]> {
  const limit = options?.limit ?? 8;

  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { genrePreferences: true },
  });

  if (!viewer?.genrePreferences.length) {
    return [];
  }

  const [followingIds, blockedUserIds] = await Promise.all([
    getFollowingIds(viewerId),
    getBlockedUserIds(viewerId),
  ]);

  const excludeIds = [viewerId, ...followingIds, ...blockedUserIds];

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      genrePreferences: { hasSome: viewer.genrePreferences },
    },
    take: limit * 4,
    select: {
      id: true,
      username: true,
      name: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      genrePreferences: true,
      _count: { select: { followers: true } },
    },
  });

  if (candidates.length === 0) {
    return [];
  }

  const genreSet = new Set(viewer.genrePreferences);

  return candidates
    .map((user) => {
      const overlap = user.genrePreferences.filter((genre) =>
        genreSet.has(genre),
      ).length;

      return {
        user,
        overlap,
        author: mapSocialAuthor(user),
      };
    })
    .sort(
      (left, right) =>
        right.overlap - left.overlap ||
        right.user._count.followers - left.user._count.followers ||
        left.user.username.localeCompare(right.user.username),
    )
    .slice(0, limit)
    .map(({ user, author }) => ({
      ...author,
      isFollowing: false,
      followerCount: user._count.followers,
    }));
}
