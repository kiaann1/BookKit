import { unstable_noStore as noStore } from "next/cache";
import {
  getPublishedBooks,
  getRecommendationCandidateBooks,
} from "@/lib/books";
import type { BookListItem } from "@/lib/books/types";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { localGetShelfEntries } from "@/lib/shelf/local";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import { matchingGenres } from "@/lib/recommendations/genre-match";
import {
  buildNewInGenresReason,
  isNewInUserGenres,
  scoreBookForUser,
  type RecommendationContext,
} from "@/lib/recommendations/score";
import type {
  RecommendationFeed,
  RecommendationOptions,
  RecommendedBook,
} from "@/lib/recommendations/types";

async function getUserGenrePreferences(userId: string) {
  if (!(await isDatabaseAvailable())) {
    return [] as string[];
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { genrePreferences: true },
    });
    return user?.genrePreferences ?? [];
  } catch {
    return [];
  }
}

async function getShelfStatusMap(userId: string) {
  const shelfByBookId = new Map<string, ShelfStatus>();

  if (!(await isDatabaseAvailable())) {
    const entries = await localGetShelfEntries(userId);
    for (const entry of entries) {
      shelfByBookId.set(entry.bookId, entry.status);
    }
    return shelfByBookId;
  }

  try {
    const rows = await prisma.userBook.findMany({
      where: { userId },
      select: { bookId: true, status: true },
    });

    for (const row of rows) {
      shelfByBookId.set(row.bookId, row.status);
    }
  } catch {
    const entries = await localGetShelfEntries(userId);
    for (const entry of entries) {
      shelfByBookId.set(entry.bookId, entry.status);
    }
  }

  return shelfByBookId;
}

async function buildContext(userId: string): Promise<RecommendationContext> {
  const [genrePreferences, shelfByBookId] = await Promise.all([
    getUserGenrePreferences(userId),
    getShelfStatusMap(userId),
  ]);

  return { genrePreferences, shelfByBookId };
}

function rankBooks(
  books: BookListItem[],
  context: RecommendationContext,
  options: RecommendationOptions,
) {
  const limit = options.limit ?? 12;
  const scored = books
    .map((book) =>
      scoreBookForUser(book, context, {
        excludeOnShelf: options.excludeOnShelf,
      }),
    )
    .filter((book): book is RecommendedBook => book !== null)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return scored.slice(0, limit);
}

function rankNewInGenreBooks(
  books: BookListItem[],
  context: RecommendationContext,
  limit: number,
) {
  if (context.genrePreferences.length === 0) {
    return [] as RecommendedBook[];
  }

  const results: RecommendedBook[] = [];

  for (const book of books) {
    if (!isNewInUserGenres(book, context)) {
      continue;
    }

    const scored = scoreBookForUser(book, context, { excludeOnShelf: true });
    if (!scored) {
      continue;
    }

    const matches = matchingGenres(book.genres, context.genrePreferences);

    results.push({
      ...scored,
      reason: buildNewInGenresReason(matches),
      score: scored.score + 15,
    });
  }

  return results
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function getRecommendationsForUser(
  userId: string,
  options: RecommendationOptions = {},
): Promise<RecommendedBook[]> {
  noStore();

  const context = await buildContext(userId);
  const books = await getRecommendationCandidateBooks(context.genrePreferences);

  return rankBooks(books, context, {
    excludeOnShelf: options.excludeOnShelf ?? true,
    limit: options.limit ?? 12,
  });
}

export async function getNewInGenreBooks(
  userId: string,
  limit = 8,
): Promise<RecommendedBook[]> {
  noStore();

  const context = await buildContext(userId);
  const books = await getRecommendationCandidateBooks(context.genrePreferences);

  return rankNewInGenreBooks(books, context, limit);
}

export async function getRecommendationFeed(
  userId: string,
): Promise<RecommendationFeed> {
  noStore();

  const context = await buildContext(userId);
  const books = await getRecommendationCandidateBooks(context.genrePreferences);

  const hasGenrePreferences = context.genrePreferences.length > 0;
  const forYou = rankBooks(books, context, {
    limit: 12,
    excludeOnShelf: true,
  });

  const forYouIds = new Set(forYou.map((book) => book.id));
  const newInYourGenres = rankNewInGenreBooks(books, context, 8).filter(
    (book) => !forYouIds.has(book.id),
  );

  return {
    forYou,
    newInYourGenres,
    hasGenrePreferences,
  };
}
