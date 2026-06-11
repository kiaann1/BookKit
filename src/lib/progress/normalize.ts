import type { ReadingProgress } from "@/lib/progress/types";

export function normalizeReadingProgress(
  row: {
    currentPage: number | null;
    totalPages: number | null;
    progressPercent: number | null;
    lastReadAt: Date | null;
    updatedAt: Date;
  } | null,
): ReadingProgress | null {
  if (!row?.currentPage || !row.totalPages) {
    return null;
  }

  const totalPages = Math.max(1, row.totalPages);
  const currentPage = Math.min(Math.max(1, row.currentPage), totalPages);
  const progressPercent =
    row.progressPercent ??
    Math.min(100, Math.round((currentPage / totalPages) * 1000) / 10);

  return {
    currentPage,
    totalPages,
    progressPercent,
    lastReadAt: row.lastReadAt ?? row.updatedAt,
  };
}
