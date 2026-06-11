import type { BookListItem } from "@/lib/books/types";

export type RecommendedBook = BookListItem & {
  reason: string;
  score: number;
};

export type RecommendationFeed = {
  forYou: RecommendedBook[];
  newInYourGenres: RecommendedBook[];
  hasGenrePreferences: boolean;
};

export type RecommendationOptions = {
  limit?: number;
  /** When true, books already on the shelf are excluded from results. */
  excludeOnShelf?: boolean;
};
