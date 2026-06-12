import { unstable_noStore as noStore } from "next/cache";
import { getPublishedBookById } from "@/lib/books";
import { BookStatus } from "@/lib/constants/book-status";
import { resolveBookListCoverUrl } from "@/lib/covers/book-cover-url";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { getBlockedUserIds } from "@/lib/social/block";
import { getFollowingIds, isFollowing } from "@/lib/social/follow";
import { mapSocialAuthor } from "@/lib/social/map";
import { canViewFullProfile } from "@/lib/social/privacy";
import type { CreatePostInput } from "@/lib/validations/post";
import { notifyPostComment, notifyPostLike } from "@/lib/notifications";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/security/sanitize";
import { getPostMediaApiUrl } from "@/lib/storage/post-media";
import type { CommentItem, FeedPage, PostItem } from "@/lib/social/types";

const authorSelect = {
  id: true,
  username: true,
  name: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const postBookSelect = {
  id: true,
  title: true,
  author: true,
  status: true,
} as const;

type PostRow = {
  id: string;
  type: PostItem["type"];
  title: string | null;
  body: string;
  mediaKey: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  book: {
    id: string;
    title: string;
    author: string;
    status: string;
  } | null;
  _count: { likes: number; comments: number };
  likes?: Array<{ userId: string }>;
};

function postListInclude(viewerId: string | null) {
  return {
    user: { select: authorSelect },
    book: { select: postBookSelect },
    _count: { select: { likes: true, comments: true } },
    ...(viewerId
      ? {
          likes: {
            where: { userId: viewerId },
            select: { userId: true },
          },
        }
      : {}),
  };
}

function mapPostBookFromJoin(book: PostRow["book"]): PostItem["book"] {
  if (!book || book.status !== BookStatus.PUBLISHED) {
    return null;
  }

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: resolveBookListCoverUrl(book.id),
  };
}

function mapPosts(rows: PostRow[], viewerId: string): PostItem[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    mediaUrl: row.mediaKey ? getPostMediaApiUrl(row.id) : null,
    createdAt: row.createdAt,
    author: mapSocialAuthor(row.user),
    book: mapPostBookFromJoin(row.book),
    likeCount: row._count.likes,
    commentCount: row._count.comments,
    likedByViewer:
      row.likes?.some((like) => like.userId === viewerId) ?? false,
  }));
}

export async function createPost(
  userId: string,
  input: CreatePostInput & { mediaKey?: string | null },
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

  const body = sanitizePlainText(input.body);
  const title =
    input.type === "ARTICLE" && input.title
      ? sanitizePlainText(input.title)
      : null;

  if (input.type === "ARTICLE" && !title) {
    return { error: "Article title is required" as const };
  }

  if (!body && input.type !== "IMAGE" && input.type !== "VIDEO") {
    return { error: "Post body is required" as const };
  }

  const post = await prisma.post.create({
    data: {
      userId,
      type: input.type,
      title,
      body,
      mediaKey: input.mediaKey ?? null,
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

  const [followingIds, blockedUserIds] = await Promise.all([
    getFollowingIds(viewerId),
    getBlockedUserIds(viewerId),
  ]);

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
    : null;

  const visibilityFilter = {
    userId: { notIn: blockedUserIds },
    OR: [
      { userId: viewerId },
      { user: { isPrivate: false } },
      { userId: { in: followingIds } },
    ],
  };

  const rows = await prisma.post.findMany({
    where: cursorFilter
      ? { AND: [cursorFilter, visibilityFilter] }
      : visibilityFilter,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: postListInclude(viewerId),
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const posts = mapPosts(pageRows, viewerId);

  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last
      ? `${last.createdAt.toISOString()}_${last.id}`
      : null;

  return { posts, nextCursor };
}

export async function getFollowingFeedPosts(
  viewerId: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<FeedPage> {
  noStore();

  const limit = options.limit ?? 20;

  if (!(await isDatabaseAvailable())) {
    return { posts: [], nextCursor: null };
  }

  const [followingIds, blockedUserIds] = await Promise.all([
    getFollowingIds(viewerId),
    getBlockedUserIds(viewerId),
  ]);

  const authorIds = followingIds.filter((id) => !blockedUserIds.includes(id));
  if (authorIds.length === 0) {
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
    : null;

  const visibilityFilter = { userId: { in: authorIds } };

  const rows = await prisma.post.findMany({
    where: cursorFilter
      ? { AND: [cursorFilter, visibilityFilter] }
      : visibilityFilter,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: postListInclude(viewerId),
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const posts = mapPosts(pageRows, viewerId);

  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last
      ? `${last.createdAt.toISOString()}_${last.id}`
      : null;

  return { posts, nextCursor };
}

export async function getFriendsRecentPosts(
  viewerId: string,
  options: { limit?: number; followingIds?: string[] } = {},
): Promise<PostItem[]> {
  noStore();

  const limit = options.limit ?? 5;

  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const followingIds =
    options.followingIds ?? (await getFollowingIds(viewerId));
  if (followingIds.length === 0) {
    return [];
  }

  const rows = await prisma.post.findMany({
    where: { userId: { in: followingIds } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: postListInclude(viewerId),
  });

  return mapPosts(rows, viewerId);
}

export async function getPostsByBookId(
  bookId: string,
  viewerId: string | null,
  options: {
    cursor?: string;
    limit?: number;
    canonicalBookId?: string;
    followingIds?: string[];
  } = {},
): Promise<FeedPage> {
  noStore();

  const limit = options.limit ?? 20;

  if (!(await isDatabaseAvailable())) {
    return { posts: [], nextCursor: null };
  }

  const resolvedBookId =
    options.canonicalBookId ?? (await getPublishedBookById(bookId))?.id;
  if (!resolvedBookId) {
    return { posts: [], nextCursor: null };
  }

  const followingIds =
    options.followingIds ??
    (viewerId ? await getFollowingIds(viewerId) : []);

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
    : null;

  const visibilityFilter = viewerId
    ? {
        OR: [
          { userId: viewerId },
          { user: { isPrivate: false } },
          { userId: { in: followingIds } },
        ],
      }
    : { user: { isPrivate: false } };

  const rows = await prisma.post.findMany({
    where: {
      bookId: resolvedBookId,
      ...(cursorFilter
        ? { AND: [cursorFilter, visibilityFilter] }
        : visibilityFilter),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: postListInclude(viewerId),
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const posts = mapPosts(pageRows, viewerId ?? "");

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
    include: postListInclude(viewerId),
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const posts = mapPosts(pageRows, viewerId);

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
    select: { id: true, userId: true },
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

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (actor?.username) {
    void notifyPostLike(post.userId, userId, actor.username, postId);
  }

  return { liked: true };
}

export async function getPostComments(
  postId: string,
  options?: { limit?: number },
) {
  if (!(await isDatabaseAvailable())) {
    return [] as CommentItem[];
  }

  const limit = options?.limit;

  const rows = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: limit ? "desc" : "asc" },
    ...(limit ? { take: limit } : {}),
    include: { user: { select: authorSelect } },
  });

  const ordered = limit ? [...rows].reverse() : rows;

  return ordered.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    author: mapSocialAuthor(row.user),
  }));
}

export async function getPostById(postId: string, viewerId: string) {
  noStore();

  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const row = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      ...postListInclude(viewerId),
      user: {
        select: {
          ...authorSelect,
          isPrivate: true,
          followersListVisibility: true,
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const following = await isFollowing(viewerId, row.user.id);
  const canView = canViewFullProfile({
    isPrivate: row.user.isPrivate,
    followersListVisibility: row.user.followersListVisibility,
    profileUserId: row.user.id,
    viewerId,
    isFollowing: following,
  });

  if (!canView) {
    return null;
  }

  const [post] = mapPosts([row], viewerId);
  return post ?? null;
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
    select: { id: true, userId: true },
  });

  if (!post) {
    return { error: "Post not found" as const };
  }

  const sanitizedBody = sanitizePlainText(body, { maxLength: 1000 });
  if (!sanitizedBody) {
    return { error: "Comment cannot be empty" as const };
  }

  const comment = await prisma.comment.create({
    data: { postId, userId, body: sanitizedBody },
    select: { id: true },
  });

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (actor?.username) {
    void notifyPostComment(
      post.userId,
      userId,
      actor.username,
      postId,
      comment.id,
    );
  }

  return { commentId: comment.id };
}

export async function reportPost(
  postId: string,
  reporterId: string,
  reason: string,
  details?: string | null,
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
    create: {
      postId,
      reporterId,
      reason: sanitizeOptionalPlainText(
        details?.trim() ? `${reason}: ${details.trim()}` : reason,
        { maxLength: 500 },
      ),
    },
    update: {
      reason: sanitizeOptionalPlainText(
        details?.trim() ? `${reason}: ${details.trim()}` : reason,
        { maxLength: 500 },
      ),
    },
  });

  return { success: true as const };
}

export async function deletePost(postId: string, userId: string) {
  if (!(await isDatabaseAvailable())) {
    return { error: "Database unavailable" as const };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) {
    return { error: "Post not found" as const };
  }

  if (post.userId !== userId) {
    return { error: "You can only delete your own posts" as const };
  }

  await prisma.post.delete({ where: { id: postId } });

  return { success: true as const };
}

export async function getPostLikes(postId: string, viewerId: string) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const post = await getPostById(postId, viewerId);
  if (!post) {
    return null;
  }

  const rows = await prisma.postLike.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      user: {
        select: authorSelect,
      },
    },
  });

  return rows.map((row) => mapSocialAuthor(row.user));
}
