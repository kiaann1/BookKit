import type { BookStatus } from "@/lib/constants/book-status";

export type CatalogFilters = {
  q?: string;
  genre?: string;
};

export type BookListItem = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  genres: string[];
  publishedAt: Date | null;
  seriesTitle: string | null;
  seriesIndex: number | null;
  status: BookStatus;
  coverUrl: string | null;
  createdAt: Date;
};
