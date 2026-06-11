import { unstable_noStore as noStore } from "next/cache";
import { getPublishedBookById } from "@/lib/books";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { getFollowingIds } from "@/lib/social/follow";
import { mapSocialAuthor } from "@/lib/social/map";
import { getPostsByBookId } from "@/lib/social/posts";
import type { SocialAuthor } from "@/lib/social/types";

const authorSelect = {
  id: true,
  username: true,
  name: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

export type BookReviewItem = {
  id: string;
  rating: number | null;
  review: string;
  shelfStatus: string;
  createdAt: Date;
  updatedAt: Date;
  author: SocialAuthor;
};

export type BookDiscussionPage = {
  posts: Awaited<ReturnType<typeof getPostsByBookId>>["posts"];
  reviews: BookReviewItem[];
  postsCursor: string | null;
};

export async function getBookReviews(
  bookId: string,
  viewerId: string | null,
  options: {
    limit?: number;
    canonicalBookId?: string;
    followingIds?: string[];
  } = {},
): Promise<BookReviewItem[]> {
  noStore();

  const limit = options.limit ?? 20;

  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const resolvedBookId =
    options.canonicalBookId ?? (await getPublishedBookById(bookId))?.id;
  if (!resolvedBookId) {
    return [];
  }

  const followingIds =
    options.followingIds ??
    (viewerId ? await getFollowingIds(viewerId) : []);

  const userVisibility = viewerId
    ? {
        OR: [
          { id: viewerId },
          { isPrivate: false },
          { id: { in: followingIds } },
        ],
      }
    : { isPrivate: false };

  const rows = await prisma.userBook.findMany({
    where: {
      bookId: resolvedBookId,
      review: { not: null },
      user: userVisibility,
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    include: {
      user: { select: authorSelect },
    },
  });

  return rows
    .filter((row) => row.review?.trim())
    .map((row) => ({
      id: row.id,
      rating: row.rating,
      review: row.review!.trim(),
      shelfStatus: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: mapSocialAuthor(row.user),
    }));
}

export async function getBookDiscussion(
  bookId: string,
  viewerId?: string | null,
  options: { canonicalBookId?: string } = {},
): Promise<BookDiscussionPage> {
  const followingIds = viewerId ? await getFollowingIds(viewerId) : [];
  const canonicalBookId =
    options.canonicalBookId ?? (await getPublishedBookById(bookId))?.id;

  if (!canonicalBookId) {
    return { posts: [], reviews: [], postsCursor: null };
  }

  const [postPage, reviews] = await Promise.all([
    getPostsByBookId(bookId, viewerId ?? null, {
      limit: 10,
      canonicalBookId,
      followingIds,
    }),
    getBookReviews(bookId, viewerId ?? null, {
      limit: 20,
      canonicalBookId,
      followingIds,
    }),
  ]);

  return {
    posts: postPage.posts,
    reviews,
    postsCursor: postPage.nextCursor,
  };
}
