import { z } from "zod";
import { MAX_SHOWCASE_BOOKS } from "@/lib/constants/shelf";
import { ShelfStatus } from "@/lib/constants/shelf-status";
import { safeResourceIdSchema } from "@/lib/validations/ids";

const shelfStatusEnum = z.enum([
  ShelfStatus.WANT_TO_READ,
  ShelfStatus.CURRENTLY_READING,
  ShelfStatus.READ,
  ShelfStatus.DNF,
]);

export const addToShelfSchema = z.object({
  bookId: safeResourceIdSchema,
  status: shelfStatusEnum.default(ShelfStatus.WANT_TO_READ),
});

export const updateShelfSchema = z
  .object({
    status: shelfStatusEnum.optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    review: z.string().trim().max(2000).nullable().optional(),
    startedAt: z.string().date().nullable().optional(),
    finishedAt: z.string().date().nullable().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.rating !== undefined ||
      data.review !== undefined ||
      data.startedAt !== undefined ||
      data.finishedAt !== undefined,
    { message: "At least one field is required" },
  );

export const setShowcaseSchema = z.object({
  bookIds: z
    .array(safeResourceIdSchema)
    .max(MAX_SHOWCASE_BOOKS, `Showcase supports up to ${MAX_SHOWCASE_BOOKS} books`),
});
