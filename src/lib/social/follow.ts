import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { notifyNewFollow } from "@/lib/notifications";
import type { FollowCounts } from "@/lib/social/types";

export async function getUserIdByUsername(username: string) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  if (!(await isDatabaseAvailable())) {
    return { followers: 0, following: 0 };
  }

  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return { followers, following };
}

export async function isFollowing(viewerId: string, targetUserId: string) {
  if (viewerId === targetUserId || !(await isDatabaseAvailable())) {
    return false;
  }

  const row = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: targetUserId,
      },
    },
  });

  return Boolean(row);
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    return { error: "You cannot follow yourself" as const };
  }

  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const [target, follower] = await Promise.all([
    prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true },
    }),
  ]);

  if (!target) {
    return { error: "User not found" as const };
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existing) {
    return { success: true as const };
  }

  await prisma.follow.create({
    data: { followerId, followingId },
  });

  if (follower?.username) {
    void notifyNewFollow(followingId, followerId, follower.username);
  }

  return { success: true as const };
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });

  return { success: true as const };
}

export async function getFollowingIds(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return [] as string[];
  }

  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  return rows.map((row) => row.followingId);
}
