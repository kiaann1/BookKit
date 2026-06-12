import type { NotificationType as PrismaNotificationType } from "@prisma/client";
import { BookStatus } from "@/lib/constants/book-status";
import { NotificationType } from "@/lib/constants/notification-types";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import type {
  NotificationItem,
  NotificationPayloadMap,
} from "@/lib/notifications/types";

function mapNotification(row: {
  id: string;
  type: PrismaNotificationType;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}): NotificationItem {
  return {
    id: row.id,
    type: row.type as NotificationItem["type"],
    payload: row.payload as NotificationItem["payload"],
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createNotification<T extends keyof NotificationPayloadMap>(
  userId: string,
  type: T,
  payload: NotificationPayloadMap[T],
) {
  if (!(await isDatabaseAvailable())) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      payload,
    },
    select: { id: true },
  });

  return notification.id;
}

export async function emitNotification<T extends keyof NotificationPayloadMap>(
  userId: string,
  type: T,
  payload: NotificationPayloadMap[T],
) {
  if (
    "actorId" in payload &&
    typeof payload.actorId === "string" &&
    userId === payload.actorId
  ) {
    return;
  }

  try {
    await createNotification(userId, type, payload);
  } catch (error) {
    console.error("[notification] emit failed:", error);
  }
}

export async function getNotifications(
  userId: string,
  options: { limit?: number } = {},
) {
  if (!(await isDatabaseAvailable())) {
    return [];
  }

  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 30,
  });

  return rows.map(mapNotification);
}

export async function getUnreadNotificationCount(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return 0;
  }

  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationsRead(
  userId: string,
  options: { ids?: string[]; all?: boolean },
) {
  if (!(await isDatabaseAvailable())) {
    return { updated: 0 };
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(options.all ? {} : { id: { in: options.ids ?? [] } }),
    },
    data: { readAt: new Date() },
  });

  return { updated: result.count };
}

export async function notifyNewFollow(
  followingId: string,
  followerId: string,
  followerUsername: string,
) {
  await emitNotification(followingId, NotificationType.FOLLOW, {
    actorId: followerId,
    actorUsername: followerUsername,
  });
}

export async function notifyPostLike(
  postOwnerId: string,
  actorId: string,
  actorUsername: string,
  postId: string,
) {
  if (postOwnerId === actorId) {
    return;
  }

  await emitNotification(postOwnerId, NotificationType.POST_LIKE, {
    actorId,
    actorUsername,
    postId,
  });
}

export async function notifyPostComment(
  postOwnerId: string,
  actorId: string,
  actorUsername: string,
  postId: string,
  commentId: string,
) {
  if (postOwnerId === actorId) {
    return;
  }

  await emitNotification(postOwnerId, NotificationType.POST_COMMENT, {
    actorId,
    actorUsername,
    postId,
    commentId,
  });
}

export async function notifyBookRequestUpdated(
  userId: string,
  input: NotificationPayloadMap["BOOK_REQUEST_UPDATED"],
) {
  await emitNotification(userId, NotificationType.BOOK_REQUEST_UPDATED, input);
}

export async function notifyUsersOfNewBook(book: {
  id: string;
  title: string;
  genres: string[];
  status: BookStatus;
  uploadedById: string;
}) {
  if (
    book.status !== BookStatus.PUBLISHED ||
    book.genres.length === 0 ||
    !(await isDatabaseAvailable())
  ) {
    return;
  }

  const recipients = await prisma.user.findMany({
    where: {
      id: { not: book.uploadedById },
      genrePreferences: { hasSome: book.genres },
    },
    select: { id: true },
    take: 200,
  });

  await Promise.all(
    recipients.map((user) =>
      emitNotification(user.id, NotificationType.NEW_BOOK_IN_GENRE, {
        bookId: book.id,
        bookTitle: book.title,
        genres: book.genres,
      }),
    ),
  );
}
