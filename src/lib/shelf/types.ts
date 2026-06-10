import type { BookListItem } from "@/lib/books/types";
import type { ShelfStatus } from "@/lib/constants/shelf-status";

export type ShelfEntry = {
  id: string;
  bookId: string;
  status: ShelfStatus;
  rating: number | null;
  review: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  currentPage: number | null;
  totalPages: number | null;
  progressPercent: number | null;
  lastReadAt: Date | null;
  showcaseOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ShelfBook = BookListItem & {
  shelfEntryId: string;
  shelfStatus: ShelfStatus;
  rating: number | null;
  review: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  currentPage: number | null;
  totalPages: number | null;
  progressPercent: number | null;
  lastReadAt: Date | null;
  showcaseOrder: number | null;
  addedAt: Date;
};

export type ShelfUpdateInput = {
  status?: ShelfStatus;
  rating?: number | null;
  review?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
};
