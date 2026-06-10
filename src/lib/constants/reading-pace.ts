export const READING_FREQUENCY_OPTIONS = [
  {
    value: 1,
    label: "Now and then",
    description: "I read when I can — a book every few weeks or so.",
    detail: "Life's busy; stories fit in when they fit in.",
  },
  {
    value: 3,
    label: "Pretty often",
    description: "I usually have something on the go and finish a book most months.",
    detail: "Reading is a regular part of my routine.",
  },
  {
    value: 6,
    label: "All the time",
    description: "I'm rarely without a book — I fly through stories.",
    detail: "The TBR pile is a lifestyle.",
  },
] as const;

export type ReadingFrequency =
  (typeof READING_FREQUENCY_OPTIONS)[number]["value"];

/** @deprecated Use READING_FREQUENCY_OPTIONS */
export const BOOKS_PER_WEEK_OPTIONS = READING_FREQUENCY_OPTIONS;

export const DEFAULT_READING_FREQUENCY: ReadingFrequency =
  READING_FREQUENCY_OPTIONS[1].value;

const frequencyValues: ReadingFrequency[] = READING_FREQUENCY_OPTIONS.map(
  (option) => option.value,
);

export function getReadingFrequencyLabel(value: number | null | undefined) {
  const normalized = normalizeReadingFrequency(value);
  return (
    READING_FREQUENCY_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? READING_FREQUENCY_OPTIONS[1].label
  );
}

export function normalizeReadingFrequency(
  value: number | null | undefined,
): ReadingFrequency {
  if (value == null) {
    return DEFAULT_READING_FREQUENCY;
  }

  if (frequencyValues.includes(value as ReadingFrequency)) {
    return value as ReadingFrequency;
  }

  return frequencyValues.reduce((closest, candidate) =>
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest,
  );
}
