import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { getBlockStatus } from "@/lib/social/block";
import { getFollowCounts, isFollowing } from "@/lib/social/follow";
import { mapSocialAuthor } from "@/lib/social/map";
import {
  canViewFollowLists,
  canViewFullProfile,
} from "@/lib/social/privacy";
import type { PublicProfile } from "@/lib/social/types";
import { getShowcaseBooks, getUserShelf } from "@/lib/shelf";

export async function getPublicProfile(
  username: string,
  viewerId: string,
) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      name: true,
      firstName: true,
      lastName: true,
      bio: true,
      avatarUrl: true,
      genrePreferences: true,
      createdAt: true,
      isPrivate: true,
      followersListVisibility: true,
    },
  });

  if (!user) {
    return null;
  }

  const [followCounts, following, blockStatus] = await Promise.all([
    getFollowCounts(user.id),
    isFollowing(viewerId, user.id),
    getBlockStatus(viewerId, user.id),
  ]);

  const isSelf = user.id === viewerId;
  const privacyContext = {
    isPrivate: user.isPrivate,
    followersListVisibility: user.followersListVisibility,
    profileUserId: user.id,
    viewerId,
    isFollowing: following,
  };

  const profile: PublicProfile = {
    ...mapSocialAuthor(user),
    bio: user.bio,
    genrePreferences: user.genrePreferences,
    createdAt: user.createdAt,
    followCounts,
    isFollowing: following,
    isSelf,
    isPrivate: user.isPrivate,
    canViewFullProfile:
      !blockStatus.hasBlockedViewer &&
      !blockStatus.isBlockedByViewer &&
      canViewFullProfile(privacyContext),
    canViewFollowLists:
      !blockStatus.hasBlockedViewer &&
      !blockStatus.isBlockedByViewer &&
      canViewFollowLists(privacyContext),
    isBlockedByViewer: blockStatus.isBlockedByViewer,
    hasBlockedViewer: blockStatus.hasBlockedViewer,
  };

  if (!profile.canViewFullProfile) {
    return {
      profile,
      showcase: [],
      shelf: [],
    };
  }

  const [showcase, shelf] = await Promise.all([
    getShowcaseBooks(user.id),
    getUserShelf(user.id),
  ]);

  const publicShelf = shelf.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    shelfStatus: book.shelfStatus,
    rating: book.rating,
  }));

  return {
    profile,
    showcase,
    shelf: publicShelf,
  };
}
