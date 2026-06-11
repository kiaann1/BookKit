import { z } from "zod";
import { POST_REPORT_REASONS } from "@/lib/constants/report-reasons";

const reportReasonValues = POST_REPORT_REASONS.map((reason) => reason.value);
import {
  ARTICLE_BODY_MAX_CHARS,
  ARTICLE_TITLE_MAX_CHARS,
  IMAGE_CAPTION_MAX_CHARS,
  POST_TYPES,
  TEXT_POST_MAX_CHARS,
  VIDEO_CAPTION_MAX_CHARS,
} from "@/lib/constants/post-types";

const bookIdField = z.string().min(1).optional().nullable();

export const createTextPostSchema = z.object({
  type: z.literal("TEXT"),
  body: z
    .string()
    .trim()
    .min(1, "Write something to post")
    .max(TEXT_POST_MAX_CHARS, `Text posts are limited to ${TEXT_POST_MAX_CHARS} characters`),
  bookId: bookIdField,
});

export const createImagePostSchema = z.object({
  type: z.literal("IMAGE"),
  body: z
    .string()
    .trim()
    .max(
      IMAGE_CAPTION_MAX_CHARS,
      `Captions are limited to ${IMAGE_CAPTION_MAX_CHARS} characters`,
    )
    .optional()
    .default(""),
  bookId: bookIdField,
});

export const createArticlePostSchema = z.object({
  type: z.literal("ARTICLE"),
  title: z
    .string()
    .trim()
    .min(1, "Add a title for your article")
    .max(
      ARTICLE_TITLE_MAX_CHARS,
      `Titles are limited to ${ARTICLE_TITLE_MAX_CHARS} characters`,
    ),
  body: z
    .string()
    .trim()
    .min(1, "Write your article")
    .max(
      ARTICLE_BODY_MAX_CHARS,
      `Articles are limited to ${ARTICLE_BODY_MAX_CHARS} characters`,
    ),
  bookId: bookIdField,
});

export const createVideoPostSchema = z.object({
  type: z.literal("VIDEO"),
  body: z
    .string()
    .trim()
    .max(
      VIDEO_CAPTION_MAX_CHARS,
      `Captions are limited to ${VIDEO_CAPTION_MAX_CHARS} characters`,
    )
    .optional()
    .default(""),
  bookId: bookIdField,
});

export const createPostSchema = z.discriminatedUnion("type", [
  createTextPostSchema,
  createImagePostSchema,
  createArticlePostSchema,
  createVideoPostSchema,
]);

export type CreatePostInput = z.infer<typeof createPostSchema>;

export function parseCreatePostForm(formData: FormData) {
  const type = formData.get("type");

  if (!POST_TYPES.includes(type as (typeof POST_TYPES)[number])) {
    return {
      success: false as const,
      error: { type: ["Choose a post type"] },
    };
  }

  const payload = {
    type,
    body: String(formData.get("body") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    bookId: formData.get("bookId")
      ? String(formData.get("bookId"))
      : null,
  };

  if (type === "TEXT") {
    const parsed = createTextPostSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors };
    }
    return { success: true as const, data: parsed.data };
  }

  if (type === "IMAGE") {
    const parsed = createImagePostSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors };
    }
    return { success: true as const, data: parsed.data };
  }

  if (type === "ARTICLE") {
    const parsed = createArticlePostSchema.safeParse({
      ...payload,
      title: payload.title,
    });
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.flatten().fieldErrors };
    }
    return { success: true as const, data: parsed.data };
  }

  const parsed = createVideoPostSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  return { success: true as const, data: parsed.data };
}

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comments are limited to 1000 characters"),
});

export const reportPostSchema = z.object({
  reason: z.enum(reportReasonValues),
  details: z.string().trim().max(500).optional().nullable(),
});

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional().default(20),
});
