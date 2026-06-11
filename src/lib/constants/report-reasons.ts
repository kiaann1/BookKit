export const POST_REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or hate speech" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright or plagiarism" },
  { value: "other", label: "Something else" },
] as const;

export type PostReportReason = (typeof POST_REPORT_REASONS)[number]["value"];
