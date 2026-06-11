import { z } from "zod";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { READING_FREQUENCY_OPTIONS } from "@/lib/constants/reading-pace";
import { USERNAME_PATTERN } from "@/lib/user/username";

const booksPerWeekValues = READING_FREQUENCY_OPTIONS.map(
  (option) => option.value,
);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    USERNAME_PATTERN,
    "Username must be 3–30 characters: lowercase letters, numbers, underscores.",
  );

export const checkNameSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
});

const genrePreferencesSchema = z
  .array(z.string())
  .min(1, "Pick at least one genre")
  .max(8, "Choose up to 8 genres")
  .refine(
    (genres) =>
      genres.every((genre) =>
        BOOK_GENRES.includes(genre as (typeof BOOK_GENRES)[number]),
      ),
    "Invalid genre selection",
  );

export const userSettingsSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  genrePreferences: genrePreferencesSchema.optional(),
  booksPerWeek: z
    .number()
    .int()
    .refine((value) =>
      booksPerWeekValues.includes(value as (typeof booksPerWeekValues)[number]),
    )
    .optional(),
});

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(80).optional(),
  genrePreferences: genrePreferencesSchema,
  booksPerWeek: z
    .number()
    .int()
    .refine((value) => booksPerWeekValues.includes(value as (typeof booksPerWeekValues)[number])),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().min(1).optional().nullable(),
  complete: z.literal(true),
});
