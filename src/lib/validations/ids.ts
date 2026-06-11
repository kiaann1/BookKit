import { z } from "zod";

/** Safe catalog / resource ids (slugs and cuids). */
export const safeResourceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);

export const optionalSafeResourceIdSchema = safeResourceIdSchema
  .optional()
  .nullable();
