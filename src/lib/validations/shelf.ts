import { z } from "zod";
import { ShelfStatus } from "@/lib/constants/shelf-status";

export const addToShelfSchema = z.object({
  bookId: z.string().min(1),
  status: z
    .enum([
      ShelfStatus.WANT_TO_READ,
      ShelfStatus.CURRENTLY_READING,
      ShelfStatus.READ,
      ShelfStatus.DNF,
    ])
    .default(ShelfStatus.WANT_TO_READ),
});

export const updateShelfSchema = z.object({
  status: z.enum([
    ShelfStatus.WANT_TO_READ,
    ShelfStatus.CURRENTLY_READING,
    ShelfStatus.READ,
    ShelfStatus.DNF,
  ]),
});
