import assert from "node:assert/strict";
import { BookStatus } from "../src/lib/constants/book-status";
import { ShelfStatus } from "../src/lib/constants/shelf-status";
import { matchingGenres } from "../src/lib/recommendations/genre-match";
import {
  isNewInUserGenres,
  scoreBookForUser,
  type RecommendationContext,
} from "../src/lib/recommendations/score";
import type { BookListItem } from "../src/lib/books/types";

function sampleBook(overrides: Partial<BookListItem> = {}): BookListItem {
  return {
    id: "test-book",
    title: "Test Book",
    author: "Author",
    description: null,
    genres: ["Sci-Fi", "Fiction"],
    publishedAt: new Date("2020-01-01"),
    seriesTitle: null,
    seriesIndex: null,
    status: BookStatus.PUBLISHED,
    coverUrl: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function context(
  overrides: Partial<RecommendationContext> = {},
): RecommendationContext {
  return {
    genrePreferences: ["Sci-Fi"],
    shelfByBookId: new Map(),
    ...overrides,
  };
}

// Broad Fiction category match
assert.deepEqual(
  matchingGenres(["Fiction"], ["Fantasy"]),
  ["Fantasy"],
  "Fiction-tagged books match fiction subgenre prefs",
);

// Direct genre match
assert.deepEqual(
  matchingGenres(["Sci-Fi", "Thriller"], ["Sci-Fi"]),
  ["Sci-Fi"],
  "direct genre overlap",
);

// Different fiction subgenres should not cross-match
assert.equal(
  scoreBookForUser(
    sampleBook({ genres: ["Romance"] }),
    context({ genrePreferences: ["Sci-Fi"] }),
  ),
  null,
  "romance does not match sci-fi preference",
);

// Score includes broad Fiction match
const fictionMatch = scoreBookForUser(
  sampleBook({ genres: ["Fiction"] }),
  context({ genrePreferences: ["Fantasy"] }),
);
assert.ok(fictionMatch, "fiction category match produces a recommendation");
assert.match(fictionMatch!.reason, /Fantasy/i);

// READ books excluded
assert.equal(
  scoreBookForUser(
    sampleBook(),
    context({
      shelfByBookId: new Map([["test-book", ShelfStatus.READ]]),
    }),
  ),
  null,
  "read books excluded",
);

// New in genres uses catalog createdAt, not old publishedAt
const recent = sampleBook({
  publishedAt: new Date("1988-01-01"),
  createdAt: new Date(),
});
assert.equal(
  isNewInUserGenres(recent, context({ genrePreferences: ["Sci-Fi"] })),
  true,
  "new catalog books qualify even with old publishedAt",
);

const stale = sampleBook({
  publishedAt: new Date("1988-01-01"),
  createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
});
assert.equal(
  isNewInUserGenres(stale, context({ genrePreferences: ["Sci-Fi"] })),
  false,
  "old catalog additions do not qualify as new",
);

console.log("Recommendation tests passed.");
