import type { BookListItem } from "@/lib/books/types";
import { ShelfStatus } from "@/lib/constants/shelf-status";
import { matchingGenres } from "@/lib/recommendations/genre-match";
import type { RecommendedBook } from "@/lib/recommendations/types";

export type RecommendationContext = {
  genrePreferences: string[];
  shelfByBookId: Map<string, (typeof ShelfStatus)[keyof typeof ShelfStatus]>;
};

const EXCLUDED_STATUSES = new Set<string>([ShelfStatus.READ, ShelfStatus.DNF]);

export const NEW_IN_GENRES_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

function recencyBoost(createdAt: Date) {
  const ageDays = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
  return Math.max(0, 20 - ageDays / 3);
}

function buildReason(
  book: BookListItem,
  matches: string[],
  hasPreferences: boolean,
) {
  if (matches.length > 0) {
    return `Because you like ${matches[0]}`;
  }

  if (!hasPreferences) {
    return "Recently added to the library";
  }

  if (book.genres.length > 0) {
    return `You might enjoy ${book.genres[0]}`;
  }

  return "Picked for you";
}

export function scoreBookForUser(
  book: BookListItem,
  context: RecommendationContext,
  options: { excludeOnShelf?: boolean } = {},
): RecommendedBook | null {
  const shelfStatus = context.shelfByBookId.get(book.id);

  if (shelfStatus && EXCLUDED_STATUSES.has(shelfStatus)) {
    return null;
  }

  if (options.excludeOnShelf && shelfStatus) {
    return null;
  }

  const matches = matchingGenres(book.genres, context.genrePreferences);
  const hasPreferences = context.genrePreferences.length > 0;

  if (hasPreferences && matches.length === 0) {
    return null;
  }

  let score = 0;

  if (hasPreferences) {
    score += matches.length * 35;
  } else {
    score += recencyBoost(book.createdAt);
  }

  score += recencyBoost(book.createdAt) * 0.5;

  if (shelfStatus === ShelfStatus.CURRENTLY_READING) {
    score -= 25;
  } else if (shelfStatus === ShelfStatus.WANT_TO_READ) {
    score -= 10;
  }

  if (book.publishedAt) {
    const publishedAgeDays =
      (Date.now() - book.publishedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (publishedAgeDays < 365) {
      score += 5;
    }
  }

  return {
    ...book,
    score,
    reason: buildReason(book, matches, hasPreferences),
  };
}

export function isNewInUserGenres(
  book: BookListItem,
  context: RecommendationContext,
  now = Date.now(),
) {
  if (context.genrePreferences.length === 0) {
    return false;
  }

  const matches = matchingGenres(book.genres, context.genrePreferences);
  if (matches.length === 0) {
    return false;
  }

  return now - book.createdAt.getTime() <= NEW_IN_GENRES_WINDOW_MS;
}

export function buildNewInGenresReason(matches: string[]) {
  if (matches.length > 0) {
    return `New in ${matches[0]}`;
  }

  return "New in your genres";
}
