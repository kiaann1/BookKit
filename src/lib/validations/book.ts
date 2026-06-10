import { z } from "zod";
import { BookStatus } from "@/lib/constants/book-status";

export const bookMetadataSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  author: z.string().min(1, "Author is required").max(200),
  description: z.string().max(5000).optional(),
  genres: z.array(z.string().min(1).max(50)).min(1, "Select at least one genre"),
  publishedAt: z
    .preprocess(
      (value) => (value === "" || value === undefined || value === null ? undefined : value),
      z.string().optional(),
    ),
  seriesTitle: z.string().max(200).optional(),
  seriesIndex: z
    .preprocess(
      (value) => (value === "" || value === undefined || value === null ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
  status: z.nativeEnum(BookStatus).default(BookStatus.PUBLISHED),
});

export type BookMetadataInput = z.infer<typeof bookMetadataSchema>;

export const MAX_PDF_BYTES = 100 * 1024 * 1024;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export const ALLOWED_PDF_TYPES = ["application/pdf"] as const;
export const ALLOWED_COVER_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
