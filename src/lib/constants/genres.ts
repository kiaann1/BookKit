export const ONBOARDING_GENRE_GROUPS = [
  {
    label: "Fiction",
    genres: [
      "Literary Fiction",
      "Contemporary Fiction",
      "Fantasy",
      "Sci-Fi",
      "Romance",
      "Mystery",
      "Thriller",
      "Horror",
      "Historical Fiction",
      "Young Adult",
      "Magical Realism",
      "Adventure",
      "Dystopian",
      "Graphic Novels",
      "Poetry",
    ],
  },
  {
    label: "Non-Fiction",
    genres: [
      "Biography",
      "Memoir",
      "History",
      "Self-Help",
      "Science",
      "True Crime",
      "Philosophy",
      "Psychology",
      "Business",
      "Health & Wellness",
      "Politics",
      "Travel",
      "Food & Cooking",
      "Essays",
      "Religion & Spirituality",
    ],
  },
] as const;

/** All genres valid for books, filters, and onboarding. */
export const BOOK_GENRES = [
  "Fiction",
  "Non-Fiction",
  ...ONBOARDING_GENRE_GROUPS.flatMap((group) => group.genres),
] as const;

export type BookGenre = (typeof BOOK_GENRES)[number];

export type GenreFilterOption = {
  genre: string;
  count: number;
};

export function buildGenreFilterOptions(
  books: ReadonlyArray<{ genres: string[] }>,
): GenreFilterOption[] {
  const counts = new Map<string, number>();

  for (const book of books) {
    for (const genre of book.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }

  const options: GenreFilterOption[] = [];
  const seen = new Set<string>();

  for (const genre of BOOK_GENRES) {
    const count = counts.get(genre);
    if (count) {
      options.push({ genre, count });
      seen.add(genre);
    }
  }

  const extras = Array.from(counts.entries())
    .filter(([genre]) => !seen.has(genre))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([genre, count]) => ({ genre, count }));

  return [...options, ...extras];
}
