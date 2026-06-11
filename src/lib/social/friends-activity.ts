import { unstable_noStore as noStore } from "next/cache";
import { BookStatus } from "@/lib/constants/book-status";
import { ShelfStatus } from "@/lib/constants/shelf-status";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { getFollowingIds } from "@/lib/social/follow";
import { mapSocialAuthor } from "@/lib/social/map";
import { getFriendsRecentPosts } from "@/lib/social/posts";
import type { FriendReadingItem, FriendsActivity } from "@/lib/social/types";
import { getCoverApiUrl } from "@/lib/storage";

const readerSelect = {
  id: true,
  username: true,
  name: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

export { getFriendsRecentPosts };

export async function getFriendsReading(
  viewerId: string,
  options: { limit?: number; followingIds?: string[] } = {},
): Promise<FriendReadingItem[]> {
  noStore();

  const limit = options.limit ?? 10;

  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const followingIds =
    options.followingIds ?? (await getFollowingIds(viewerId));
  if (followingIds.length === 0) {
    return [];
  }

  const rows = await prisma.userBook.findMany({
    where: {
      userId: { in: followingIds },
      status: ShelfStatus.CURRENTLY_READING,
      book: { status: BookStatus.PUBLISHED },
    },
    orderBy: [{ lastReadAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      user: { select: readerSelect },
      book: {
        select: {
          id: true,
          title: true,
          author: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    reader: mapSocialAuthor(row.user),
    book: {
      id: row.book.id,
      title: row.book.title,
      author: row.book.author,
      coverUrl: getCoverApiUrl(row.book.id),
    },
    progressPercent: row.progressPercent,
    lastReadAt: row.lastReadAt,
  }));
}

export async function getFriendsActivity(
  viewerId: string,
): Promise<FriendsActivity> {
  const followingIds = await getFollowingIds(viewerId);

  const [recentPosts, friendsReading] = await Promise.all([
    getFriendsRecentPosts(viewerId, { limit: 5, followingIds }),
    getFriendsReading(viewerId, { limit: 10, followingIds }),
  ]);

  return {
    recentPosts,
    friendsReading,
    followingCount: followingIds.length,
  };
}
