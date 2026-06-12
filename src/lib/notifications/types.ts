import type { NotificationTypeValue } from "@/lib/constants/notification-types";

export type NotificationPayloadMap = {
  FOLLOW: { actorId: string; actorUsername: string };
  POST_LIKE: { actorId: string; actorUsername: string; postId: string };
  POST_COMMENT: {
    actorId: string;
    actorUsername: string;
    postId: string;
    commentId: string;
  };
  BOOK_REQUEST_UPDATED: {
    requestId: string;
    status: string;
    title: string;
    bookId?: string | null;
    bookTitle?: string | null;
  };
  NEW_BOOK_IN_GENRE: {
    bookId: string;
    bookTitle: string;
    genres: string[];
  };
};

export type NotificationItem = {
  id: string;
  type: NotificationTypeValue;
  payload: NotificationPayloadMap[NotificationTypeValue];
  readAt: string | null;
  createdAt: string;
};

export type NotificationPresentation = {
  title: string;
  body?: string;
  href: string;
};
