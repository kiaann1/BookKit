import { z } from "zod";
import { usernameSchema } from "@/lib/validations/user";

export const sendMessageSchema = z
  .object({
    conversationId: z.string().min(1).optional(),
    recipientUsername: usernameSchema.optional(),
    body: z.string().trim().max(2000, "Messages are limited to 2000 characters").optional(),
  })
  .refine((data) => data.conversationId || data.recipientUsername, {
    message: "Choose a recipient or conversation",
  })
  .refine((data) => !data.conversationId || Boolean(data.body?.trim()), {
    message: "Write a message",
    path: ["body"],
  });
