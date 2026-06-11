import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { unfollowUser } from "@/lib/social/follow";

export async function isUserBlocked(blockerId: string, blockedId: string) {
  if (blockerId === blockedId || !(await isDatabaseAvailable())) {
    return false;
  }

  const row = await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
  });

  return Boolean(row);
}

export async function getBlockedUserIds(viewerId: string) {
  if (!(await isDatabaseAvailable())) {
    return [] as string[];
  }

  const [blocked, blockedBy] = await Promise.all([
    prisma.userBlock.findMany({
      where: { blockerId: viewerId },
      select: { blockedId: true },
    }),
    prisma.userBlock.findMany({
      where: { blockedId: viewerId },
      select: { blockerId: true },
    }),
  ]);

  return [
    ...new Set([
      ...blocked.map((row) => row.blockedId),
      ...blockedBy.map((row) => row.blockerId),
    ]),
  ];
}

export async function getBlockStatus(
  viewerId: string,
  targetUserId: string,
) {
  if (viewerId === targetUserId || !(await isDatabaseAvailable())) {
    return {
      isBlockedByViewer: false,
      hasBlockedViewer: false,
    };
  }

  const [isBlockedByViewer, hasBlockedViewer] = await Promise.all([
    isUserBlocked(viewerId, targetUserId),
    isUserBlocked(targetUserId, viewerId),
  ]);

  return { isBlockedByViewer, hasBlockedViewer };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    return { error: "You cannot block yourself" as const };
  }

  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const target = await prisma.user.findUnique({
    where: { id: blockedId },
    select: { id: true },
  });

  if (!target) {
    return { error: "User not found" as const };
  }

  await prisma.userBlock.upsert({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
    create: { blockerId, blockedId },
    update: {},
  });

  await Promise.all([
    unfollowUser(blockerId, blockedId),
    unfollowUser(blockedId, blockerId),
  ]);

  return { success: true as const };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  await prisma.userBlock.deleteMany({
    where: { blockerId, blockedId },
  });

  return { success: true as const };
}
