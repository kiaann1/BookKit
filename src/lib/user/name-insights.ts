import type { BookGenre } from "@/lib/constants/genres";

export type NameBookRecommendation = {
  title: string;
  author: string;
  genre: BookGenre;
  reason: string;
};

const NAME_HINTS: Array<{
  pattern: RegExp;
  genres: BookGenre[];
  books: NameBookRecommendation[];
}> = [
  {
    pattern: /mary|maria|marie/i,
    genres: ["Sci-Fi", "Fiction"],
    books: [
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        genre: "Sci-Fi",
        reason: "Bold, hopeful sci-fi with heart.",
      },
      {
        title: "The Poppy War",
        author: "R.F. Kuang",
        genre: "Fantasy",
        reason: "Epic and fiercely written.",
      },
    ],
  },
  {
    pattern: /war|battle|soldier|knight/i,
    genres: ["Fantasy", "History"],
    books: [
      {
        title: "The Poppy War",
        author: "R.F. Kuang",
        genre: "Fantasy",
        reason: "Military fantasy with real emotional weight.",
      },
      {
        title: "The Nightingale",
        author: "Kristin Hannah",
        genre: "History",
        reason: "Courage under impossible odds.",
      },
    ],
  },
  {
    pattern: /rose|flora|lily|violet|ivy/i,
    genres: ["Romance", "Literary Fiction"],
    books: [
      {
        title: "Medusa",
        author: "Rosie Hewlett",
        genre: "Romance",
        reason: "Mythic romance with a modern edge.",
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Literary Fiction",
        reason: "Timeless wit and romance.",
      },
    ],
  },
  {
    pattern: /grace|faith|hope|saint/i,
    genres: ["Self-Help", "Memoir"],
    books: [
      {
        title: "The Courage to Be Disliked",
        author: "Ichiro Kishimi",
        genre: "Self-Help",
        reason: "Philosophy for living lighter.",
      },
      {
        title: "Educated",
        author: "Tara Westover",
        genre: "Memoir",
        reason: "Transformation and resilience.",
      },
    ],
  },
  {
    pattern: /max|leo|alex|ander|son$/i,
    genres: ["Thriller", "Mystery"],
    books: [
      {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        genre: "Thriller",
        reason: "Twisty psychological suspense.",
      },
      {
        title: "Gone Girl",
        author: "Gillian Flynn",
        genre: "Mystery",
        reason: "Dark, propulsive, and iconic.",
      },
    ],
  },
];

const DEFAULT_BOOKS: NameBookRecommendation[] = [
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Sci-Fi",
    reason: "A crowd-pleaser to kick off your shelf.",
  },
  {
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    genre: "Self-Help",
    reason: "Sharp, funny, and surprisingly thoughtful.",
  },
  {
    title: "The Poppy War",
    author: "R.F. Kuang",
    genre: "Fantasy",
    reason: "Unforgettable fantasy for adventurous readers.",
  },
];

export function buildDisplayNameSuggestions(
  firstName: string,
  lastName: string,
  count: number,
) {
  const first = firstName.trim();
  const last = lastName.trim();
  const initial = last.charAt(0).toUpperCase();
  const suggestions = [
    `${first} ${last}`,
    `${first} ${initial}.`,
    `${first}${last.charAt(0).toUpperCase()}${last.slice(1)}`,
    count > 0 ? `${first} ${last} (${count + 1})` : null,
    `${first} from BookKit`,
  ].filter((value): value is string => Boolean(value?.trim()));

  return Array.from(new Set(suggestions));
}

export function getNameBasedRecommendations(firstName: string, lastName: string) {
  const full = `${firstName} ${lastName}`.trim();
  const matches = NAME_HINTS.filter((hint) => hint.pattern.test(full));

  const genres = Array.from(
    new Set(matches.flatMap((match) => match.genres)),
  ).slice(0, 5);

  const books = Array.from(
    new Map(
      [...matches.flatMap((match) => match.books), ...DEFAULT_BOOKS].map(
        (book) => [`${book.title}:${book.author}`, book],
      ),
    ).values(),
  ).slice(0, 4);

  return { genres, books };
}
