import { z } from "zod";
import { BOOK_REQUEST_STATUSES } from "@/lib/constants/book-request-status";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/security/sanitize";
import { optionalSafeResourceIdSchema } from "@/lib/validations/ids";

export const createBookRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  author: z
    .string()
    .trim()
    .min(1, "Author is required")
    .max(120, "Author must be 120 characters or fewer"),
  notes: z.string().trim().max(1000).optional().nullable(),
  isbn: z
    .string()
    .trim()
    .max(32, "ISBN or link must be 32 characters or fewer")
    .optional()
    .nullable(),
});

export type CreateBookRequestInput = z.infer<typeof createBookRequestSchema>;

export function parseCreateBookRequestBody(body: unknown) {
  const parsed = createBookRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  return {
    success: true as const,
    data: {
      title: sanitizePlainText(parsed.data.title, { maxLength: 200 }),
      author: sanitizePlainText(parsed.data.author, { maxLength: 120 }),
      notes: sanitizeOptionalPlainText(parsed.data.notes, { maxLength: 1000 }),
      isbn: sanitizeOptionalPlainText(parsed.data.isbn, { maxLength: 32 }),
    },
  };
}

export const adminBookRequestQuerySchema = z.object({
  status: z.enum(BOOK_REQUEST_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const adminUpdateBookRequestSchema = z.object({
  status: z.enum(BOOK_REQUEST_STATUSES).optional(),
  adminNote: z.string().trim().max(1000).optional().nullable(),
  linkedBookId: optionalSafeResourceIdSchema,
});
