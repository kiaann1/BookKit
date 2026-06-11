import { z } from "zod";
import { POST_REPORT_REASONS } from "@/lib/constants/report-reasons";
import { sanitizeOptionalPlainText } from "@/lib/security/sanitize";

const reportReasonValues = POST_REPORT_REASONS.map((reason) => reason.value);

export const reportUserSchema = z.object({
  reason: z.enum(reportReasonValues),
  details: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => sanitizeOptionalPlainText(value, { maxLength: 500 })),
});
