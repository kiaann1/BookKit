import { NotificationType } from "@/lib/constants/notification-types";
import { BOOK_REQUEST_STATUS_LABELS } from "@/lib/constants/book-request-status";
import { catalogBookPath } from "@/lib/books/paths";
import type {
  NotificationItem,
  NotificationPresentation,
} from "@/lib/notifications/types";

export function presentNotification(
  notification: NotificationItem,
): NotificationPresentation {
  switch (notification.type) {
    case NotificationType.FOLLOW: {
      const payload = notification.payload as NotificationItem["payload"] & {
        actorUsername: string;
      };
      return {
        title: `@${payload.actorUsername} started following you`,
        href: `/u/${payload.actorUsername}`,
      };
    }
    case NotificationType.POST_LIKE: {
      const payload = notification.payload as NotificationItem["payload"] & {
        actorUsername: string;
        postId: string;
      };
      return {
        title: `@${payload.actorUsername} liked your post`,
        href: `/posts/${payload.postId}`,
      };
    }
    case NotificationType.POST_COMMENT: {
      const payload = notification.payload as NotificationItem["payload"] & {
        actorUsername: string;
        postId: string;
      };
      return {
        title: `@${payload.actorUsername} commented on your post`,
        href: `/posts/${payload.postId}`,
      };
    }
    case NotificationType.BOOK_REQUEST_UPDATED: {
      const payload = notification.payload as NotificationItem["payload"] & {
        status: string;
        title: string;
        bookId?: string | null;
        bookTitle?: string | null;
      };
      const statusLabel =
        BOOK_REQUEST_STATUS_LABELS[
          payload.status as keyof typeof BOOK_REQUEST_STATUS_LABELS
        ] ?? payload.status;
      return {
        title: `Book request update: ${payload.title}`,
        body: statusLabel,
        href:
          payload.status === "ADDED" && payload.bookId
            ? catalogBookPath(payload.bookId)
            : "/requests",
      };
    }
    case NotificationType.NEW_BOOK_IN_GENRE: {
      const payload = notification.payload as NotificationItem["payload"] & {
        bookId: string;
        bookTitle: string;
        genres: string[];
      };
      return {
        title: `New in your genres: ${payload.bookTitle}`,
        body: payload.genres.slice(0, 3).join(", "),
        href: catalogBookPath(payload.bookId),
      };
    }
    default:
      return { title: "Notification", href: "/dashboard" };
  }
}
