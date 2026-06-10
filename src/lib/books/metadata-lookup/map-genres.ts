const GENRE_RULES: Array<{ genre: string; test: (value: string) => boolean }> = [
  { genre: "Sci-Fi", test: (v) => /science[- ]fiction|sci[- ]?fi|hard sci/i.test(v) },
  { genre: "Fantasy", test: (v) => /fantasy|magic|dragons?/i.test(v) },
  { genre: "Romance", test: (v) => /romance|love story/i.test(v) },
  { genre: "Thriller", test: (v) => /thriller|suspense/i.test(v) },
  { genre: "Mystery", test: (v) => /mystery|detective|crime/i.test(v) },
  { genre: "Horror", test: (v) => /horror/i.test(v) },
  { genre: "Biography", test: (v) => /biograph/i.test(v) },
  { genre: "History", test: (v) => /(^history|historical)/i.test(v) },
  {
    genre: "Self-Help",
    test: (v) => /self[- ]help|personal (growth|development)|psychology/i.test(v),
  },
  { genre: "Young Adult", test: (v) => /young adult|juvenile fiction|ya fiction/i.test(v) },
  { genre: "Poetry", test: (v) => /poetry/i.test(v) },
  { genre: "Memoir", test: (v) => /memoir/i.test(v) },
  { genre: "Literary Fiction", test: (v) => /literary fiction/i.test(v) },
  { genre: "Essays", test: (v) => /essays?/i.test(v) },
  { genre: "Fiction", test: (v) => /^fiction$|fiction,/i.test(v) },
  { genre: "Non-Fiction", test: (v) => /non[- ]?fiction/i.test(v) },
];

export function mapLabelsToGenres(labels: string[]) {
  const genres = new Set<string>();
  const normalized = labels.map((label) => label.trim()).filter(Boolean);

  for (const label of normalized) {
    for (const rule of GENRE_RULES) {
      if (rule.test(label)) {
        genres.add(rule.genre);
      }
    }
  }

  return Array.from(genres).slice(0, 4);
}
