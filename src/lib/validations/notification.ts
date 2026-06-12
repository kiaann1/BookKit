import { z } from "zod";

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(30),
});

export const markNotificationsReadSchema = z
  .object({
    ids: z.array(z.string().min(1)).optional(),
    all: z.literal(true).optional(),
  })
  .refine((data) => data.all || (data.ids && data.ids.length > 0), {
    message: "Provide notification ids or set all to true",
  });
