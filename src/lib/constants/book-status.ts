export const BookStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type BookStatus = (typeof BookStatus)[keyof typeof BookStatus];
