import { readFile } from "@/lib/storage";
import { postMediaKey } from "@/lib/storage/keys";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;
const VIDEO_EXTENSIONS = ["mp4", "webm"] as const;

export function getPostMediaApiUrl(postId: string) {
  return `/api/files/posts/${postId}/media`;
}

export function resolveImageExtension(file: File) {
  const fromMime = extensionFromImageMime(file.type);
  if (fromMime) {
    return fromMime;
  }

  const match = file.name.match(/\.(jpe?g|png|webp|gif)$/i);
  return match?.[1]?.toLowerCase().replace("jpeg", "jpg") ?? null;
}

export function resolveVideoExtension(file: File) {
  const fromMime = extensionFromVideoMime(file.type);
  if (fromMime) {
    return fromMime;
  }

  const match = file.name.match(/\.(mp4|webm)$/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function extensionFromImageMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

function extensionFromVideoMime(mime: string) {
  switch (mime) {
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return null;
  }
}

export function isAllowedPostImage(file: File) {
  return Boolean(resolveImageExtension(file));
}

export function isAllowedPostVideo(file: File) {
  return Boolean(resolveVideoExtension(file));
}

export function postMediaContentType(extension: string) {
  switch (extension) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

export async function readStoredPostMedia(postId: string, mediaKey: string) {
  const extension = mediaKey.split(".").pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  const bytes = await readFile(mediaKey);
  if (!bytes) {
    return null;
  }

  return {
    bytes,
    extension,
    contentType: postMediaContentType(extension),
  };
}

export function mediaKeyForPost(postId: string, extension: string) {
  return postMediaKey(postId, extension);
}
