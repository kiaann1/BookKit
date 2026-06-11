import { z } from "zod";
import { FOLLOW_LIST_VISIBILITY_OPTIONS } from "@/lib/constants/privacy";

const visibilityValues = FOLLOW_LIST_VISIBILITY_OPTIONS.map(
  (option) => option.value,
);

export const userPrivacySchema = z.object({
  isPrivate: z.boolean().optional(),
  followersListVisibility: z
    .enum(visibilityValues)
    .optional(),
});
