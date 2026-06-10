import type { ShelfEntry } from "@/lib/shelf/types";

export function toShelfEntry(row: {
  id: string;
  bookId: string;
  status: string;
  rating: number | null;
  review?: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  currentPage?: number | null;
  totalPages?: number | null;
  progressPercent?: number | null;
  lastReadAt?: Date | null;
  showcaseOrder?: number | null;
  createdAt: Date;
  updatedAt: Date;
}): ShelfEntry {
  return {
    id: row.id,
    bookId: row.bookId,
    status: row.status as ShelfEntry["status"],
    rating: row.rating,
    review: row.review ?? null,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    currentPage: row.currentPage ?? null,
    totalPages: row.totalPages ?? null,
    progressPercent: row.progressPercent ?? null,
    lastReadAt: row.lastReadAt ?? null,
    showcaseOrder: row.showcaseOrder ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
