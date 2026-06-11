export const POST_TYPES = ["TEXT", "IMAGE", "ARTICLE", "VIDEO"] as const;

export type PostType = (typeof POST_TYPES)[number];

export const TEXT_POST_MAX_CHARS = 200;
export const IMAGE_CAPTION_MAX_CHARS = 500;
export const VIDEO_CAPTION_MAX_CHARS = 500;
export const ARTICLE_TITLE_MAX_CHARS = 120;
export const ARTICLE_BODY_MAX_CHARS = 5000;

export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_VIDEO_BYTES = 50 * 1024 * 1024;

export const POST_TYPE_OPTIONS: Array<{
  value: PostType;
  label: string;
  description: string;
}> = [
  {
    value: "TEXT",
    label: "Text",
    description: `Short update · up to ${TEXT_POST_MAX_CHARS} characters`,
  },
  {
    value: "IMAGE",
    label: "Photo",
    description: "Image with an optional caption",
  },
  {
    value: "ARTICLE",
    label: "Article",
    description: "Longer write-up with a title",
  },
  {
    value: "VIDEO",
    label: "Video",
    description: "Clip with an optional caption",
  },
];
