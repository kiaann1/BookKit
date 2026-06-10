import { z } from "zod";

export const saveProgressSchema = z.object({
  currentPage: z.number().int().min(1),
  totalPages: z.number().int().min(1),
});
