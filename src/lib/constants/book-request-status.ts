export const BookRequestStatus = {
  PENDING: "PENDING",
  SOURCED: "SOURCED",
  ADDED: "ADDED",
  DECLINED: "DECLINED",
} as const;

export type BookRequestStatus =
  (typeof BookRequestStatus)[keyof typeof BookRequestStatus];

export const BOOK_REQUEST_STATUSES = [
  BookRequestStatus.PENDING,
  BookRequestStatus.SOURCED,
  BookRequestStatus.ADDED,
  BookRequestStatus.DECLINED,
] as const;

export const BOOK_REQUEST_STATUS_LABELS: Record<BookRequestStatus, string> = {
  PENDING: "Pending",
  SOURCED: "Sourced",
  ADDED: "Added to catalog",
  DECLINED: "Declined",
};

export const BOOK_REQUEST_STATUS_DESCRIPTIONS: Record<
  BookRequestStatus,
  string
> = {
  PENDING: "Waiting for an admin to review",
  SOURCED: "We're working on finding this title",
  ADDED: "This book is now in the catalog",
  DECLINED: "We couldn't add this title",
};
