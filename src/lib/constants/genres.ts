export const BOOK_GENRES = [
  "Fiction",
  "Non-Fiction",
  "Fantasy",
  "Sci-Fi",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Biography",
  "History",
  "Self-Help",
  "Poetry",
  "Young Adult",
  "Literary Fiction",
  "Memoir",
  "Essays",
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
