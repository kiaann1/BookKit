export const NotificationType = {
  NEW_BOOK_IN_GENRE: "NEW_BOOK_IN_GENRE",
  FOLLOW: "FOLLOW",
  POST_LIKE: "POST_LIKE",
  POST_COMMENT: "POST_COMMENT",
  BOOK_REQUEST_UPDATED: "BOOK_REQUEST_UPDATED",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];
