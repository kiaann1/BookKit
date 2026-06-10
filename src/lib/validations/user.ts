import { z } from "zod";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { BOOKS_PER_WEEK_OPTIONS } from "@/lib/constants/reading-pace";

const booksPerWeekValues = BOOKS_PER_WEEK_OPTIONS.map((option) => option.value);

export const checkNameSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
});

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  displayName: z.string().trim().min(1).max(80),
  genrePreferences: z
    .array(z.string())
    .min(1, "Pick at least one genre")
    .max(8)
    .refine(
      (genres) => genres.every((genre) => BOOK_GENRES.includes(genre as (typeof BOOK_GENRES)[number])),
      "Invalid genre selection",
    ),
  booksPerWeek: z
    .number()
    .int()
    .refine((value) => booksPerWeekValues.includes(value as (typeof booksPerWeekValues)[number])),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  complete: z.literal(true),
});
