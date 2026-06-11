import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { getUserIdByUsername, isFollowing } from "@/lib/social/follow";
import { mapSocialAuthor } from "@/lib/social/map";
import {
  canViewFollowLists,
  type ProfilePrivacy,
} from "@/lib/social/privacy";
import type { SocialAuthor } from "@/lib/social/types";

export type FollowListEntry = SocialAuthor & {
  isFollowing: boolean;
};

async function getProfilePrivacy(
  userId: string,
): Promise<ProfilePrivacy | null> {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPrivate: true,
      followersListVisibility: true,
    },
  });

  return user;
}

async function mapFollowListEntries(
  users: Array<{
    id: string;
    username: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  }>,
  viewerId: string,
): Promise<FollowListEntry[]> {
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

  return users.map((user) => ({
    ...mapSocialAuthor(user),
    isFollowing: followingIds.has(user.id),
  }));
}

export async function getFollowersList(username: string, viewerId: string) {
  const profileUserId = await getUserIdByUsername(username);

  if (!profileUserId) {
    return { error: "not_found" as const };
  }

  const privacy = await getProfilePrivacy(profileUserId);
  if (!privacy) {
    return { error: "unavailable" as const };
  }

  const viewerFollowsProfile = await isFollowing(viewerId, profileUserId);
  const context = {
    ...privacy,
    profileUserId,
    viewerId,
    isFollowing: viewerFollowsProfile,
  };

  if (!canViewFollowLists(context)) {
    return { error: "forbidden" as const };
  }

  const rows = await prisma.follow.findMany({
    where: { followingId: profileUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  const entries = await mapFollowListEntries(
    rows.map((row) => row.follower),
    viewerId,
  );

  return { users: entries };
}

export async function getFollowingList(username: string, viewerId: string) {
  const profileUserId = await getUserIdByUsername(username);

  if (!profileUserId) {
    return { error: "not_found" as const };
  }

  const privacy = await getProfilePrivacy(profileUserId);
  if (!privacy) {
    return { error: "unavailable" as const };
  }

  const viewerFollowsProfile = await isFollowing(viewerId, profileUserId);
  const context = {
    ...privacy,
    profileUserId,
    viewerId,
    isFollowing: viewerFollowsProfile,
  };

  if (!canViewFollowLists(context)) {
    return { error: "forbidden" as const };
  }

  const rows = await prisma.follow.findMany({
    where: { followerId: profileUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  const entries = await mapFollowListEntries(
    rows.map((row) => row.following),
    viewerId,
  );

  return { users: entries };
}
