import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { getFollowCounts, isFollowing } from "@/lib/social/follow";
import { mapSocialAuthor } from "@/lib/social/map";
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
    },
  });

  if (!user) {
    return null;
  }

  const [followCounts, following, showcase, shelf] = await Promise.all([
    getFollowCounts(user.id),
    isFollowing(viewerId, user.id),
    getShowcaseBooks(user.id),
    getUserShelf(user.id),
  ]);

  const profile: PublicProfile = {
    ...mapSocialAuthor(user),
    bio: user.bio,
    genrePreferences: user.genrePreferences,
    createdAt: user.createdAt,
    followCounts,
    isFollowing: following,
    isSelf: user.id === viewerId,
  };

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
