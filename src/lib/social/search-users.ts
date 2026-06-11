import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { mapSocialAuthor } from "@/lib/social/map";
import type { UserSearchResult } from "@/lib/social/types";

function rankMatch(
  username: string,
  displayName: string,
  query: string,
): number {
  const normalizedUsername = username.toLowerCase();
  const normalizedDisplayName = displayName.toLowerCase();

  if (normalizedUsername === query) {
    return 0;
  }
  if (normalizedUsername.startsWith(query)) {
    return 1;
  }
  if (normalizedUsername.includes(query)) {
    return 2;
  }
  if (normalizedDisplayName.startsWith(query)) {
    return 3;
  }
  if (normalizedDisplayName.includes(query)) {
    return 4;
  }

  return 5;
}

export async function searchUsers(
  query: string,
  viewerId: string,
  options?: { limit?: number },
): Promise<UserSearchResult[]> {
  const limit = options?.limit ?? 12;
  const trimmed = query.trim().toLowerCase();

  if (trimmed.length < 2 || !(await isDatabaseAvailable())) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      OR: [
        { username: { contains: trimmed, mode: "insensitive" } },
        { name: { contains: trimmed, mode: "insensitive" } },
        { firstName: { contains: trimmed, mode: "insensitive" } },
        { lastName: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: Math.min(limit * 3, 36),
    select: {
      id: true,
      username: true,
      name: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      _count: { select: { followers: true } },
    },
  });

  if (users.length === 0) {
    return [];
  }

  const followingRows = await prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: users.map((user) => user.id) },
    },
    select: { followingId: true },
  });
  const followingIds = new Set(followingRows.map((row) => row.followingId));

  return users
    .map((user) => {
      const author = mapSocialAuthor(user);
      return {
        user,
        author,
        rank: rankMatch(user.username, author.displayName, trimmed),
      };
    })
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        left.user.username.localeCompare(right.user.username),
    )
    .slice(0, limit)
    .map(({ user, author }) => ({
      ...author,
      isFollowing: followingIds.has(user.id),
      followerCount: user._count.followers,
    }));
}
