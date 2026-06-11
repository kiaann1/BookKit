import { z } from "zod";

export const createPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write something to post")
    .max(2000, "Posts are limited to 2000 characters"),
  bookId: z.string().min(1).optional().nullable(),
});

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comments are limited to 1000 characters"),
});

export const reportPostSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional().default(20),
});
