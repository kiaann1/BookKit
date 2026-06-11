import { unstable_noStore as noStore } from "next/cache";
import { getPublishedBookById } from "@/lib/books";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { isFollowing } from "@/lib/social/follow";
import { mapPostBook, mapSocialAuthor } from "@/lib/social/map";
import { canViewFullProfile } from "@/lib/social/privacy";
import type { CommentItem, FeedPage, PostItem } from "@/lib/social/types";

const authorSelect = {
  id: true,
  username: true,
  name: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

async function mapPosts(
  rows: Array<{
    id: string;
    body: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
    bookId: string | null;
    _count: { likes: number; comments: number };
    likes: Array<{ userId: string }>;
  }>,
  viewerId: string,
): Promise<PostItem[]> {
  const posts: PostItem[] = [];

  for (const row of rows) {
    let book = null;
    if (row.bookId) {
      const catalogBook = await getPublishedBookById(row.bookId);
      if (catalogBook) {
        book = mapPostBook(catalogBook);
      }
    }

    posts.push({
      id: row.id,
      body: row.body,
      createdAt: row.createdAt,
      author: mapSocialAuthor(row.user),
      book,
      likeCount: row._count.likes,
      commentCount: row._count.comments,
      likedByViewer: row.likes.some((like) => like.userId === viewerId),
    });
  }

  return posts;
}

export async function createPost(
  userId: string,
  input: { body: string; bookId?: string | null },
) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  if (input.bookId) {
    const book = await getPublishedBookById(input.bookId);
    if (!book) {
      return { error: "Book not found" as const };
    }
  }

  const post = await prisma.post.create({
    data: {
      userId,
      body: input.body,
      bookId: input.bookId ?? null,
    },
    select: { id: true },
  });

  return { postId: post.id };
}

export async function getFeedPosts(
  viewerId: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<FeedPage> {
  noStore();

  const limit = options.limit ?? 20;

  if (!(await isDatabaseAvailable())) {
    return { posts: [], nextCursor: null };
  }

  const following = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });

  const authorIds = [...new Set([viewerId, ...following.map((f) => f.followingId)])];

  const cursorFilter = options.cursor
    ? {
        OR: [
          { createdAt: { lt: new Date(options.cursor.split("_")[0]!) } },
          {
            createdAt: new Date(options.cursor.split("_")[0]!),
            id: { lt: options.cursor.split("_")[1]! },
          },
        ],
      }
    : {};

  const rows = await prisma.post.findMany({
    where: {
      userId: { in: authorIds },
      ...cursorFilter,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      user: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: viewerId },
        select: { userId: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const posts = await mapPosts(pageRows, viewerId);

  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last
      ? `${last.createdAt.toISOString()}_${last.id}`
      : null;

  return { posts, nextCursor };
}

export async function getUserPosts(
  username: string,
  viewerId: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<FeedPage> {
  noStore();

  const limit = options.limit ?? 20;

  if (!(await isDatabaseAvailable())) {
    return { posts: [], nextCursor: null };
  }

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      isPrivate: true,
      followersListVisibility: true,
    },
  });

  if (!user) {
    return { posts: [], nextCursor: null };
  }

  const following = await isFollowing(viewerId, user.id);
  const canView = canViewFullProfile({
    isPrivate: user.isPrivate,
    followersListVisibility: user.followersListVisibility,
    profileUserId: user.id,
    viewerId,
    isFollowing: following,
  });

  if (!canView) {
    return { posts: [], nextCursor: null };
  }

  const cursorFilter = options.cursor
    ? {
        OR: [
          { createdAt: { lt: new Date(options.cursor.split("_")[0]!) } },
          {
            createdAt: new Date(options.cursor.split("_")[0]!),
            id: { lt: options.cursor.split("_")[1]! },
          },
        ],
      }
    : {};

  const rows = await prisma.post.findMany({
    where: {
      userId: user.id,
      ...cursorFilter,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      user: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: viewerId },
        select: { userId: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const posts = await mapPosts(pageRows, viewerId);

  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last
      ? `${last.createdAt.toISOString()}_${last.id}`
      : null;

  return { posts, nextCursor };
}

export async function togglePostLike(postId: string, userId: string) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return { error: "Post not found" as const };
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.postLike.delete({
      where: { postId_userId: { postId, userId } },
    });
    return { liked: false };
  }

  await prisma.postLike.create({ data: { postId, userId } });
  return { liked: true };
}

export async function getPostComments(postId: string) {
  if (!(await isDatabaseAvailable())) {
    return [] as CommentItem[];
  }

  const rows = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: authorSelect } },
  });

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    author: mapSocialAuthor(row.user),
  }));
}

export async function createComment(
  postId: string,
  userId: string,
  body: string,
) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return { error: "Post not found" as const };
  }

  const comment = await prisma.comment.create({
    data: { postId, userId, body },
    select: { id: true },
  });

  return { commentId: comment.id };
}

export async function reportPost(
  postId: string,
  reporterId: string,
  reason?: string | null,
) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return { error: "Post not found" as const };
  }

  await prisma.postReport.upsert({
    where: {
      postId_reporterId: { postId, reporterId },
    },
    create: { postId, reporterId, reason: reason?.trim() || null },
    update: { reason: reason?.trim() || null },
  });

  return { success: true as const };
}
