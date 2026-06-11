import { userAvatarKey } from "@/lib/storage/keys";
import { deleteFile, fileExists, readFile } from "@/lib/storage";

const AVATAR_EXTENSIONS = ["jpg", "png", "webp"] as const;

export function extensionFromFileName(fileName: string) {
  const match = fileName.toLowerCase().match(/\.(jpe?g|png|webp)$/);
  if (!match) {
    return null;
  }
  return match[1] === "jpeg" ? "jpg" : match[1];
}

export function resolveAvatarExtension(file: File) {
  const fromMime = extensionFromMime(file.type);
  if (fromMime) {
    return fromMime;
  }

  return extensionFromFileName(file.name) ?? "jpg";
}

export function extensionFromMime(mime: string) {
  switch (mime.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
    case "image/pjpeg":
      return "jpg";
    case "image/png":
    case "image/x-png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export function isAllowedAvatarFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return extensionFromFileName(file.name) !== null;
}

export async function findStoredAvatarKey(userId: string) {
  for (const extension of AVATAR_EXTENSIONS) {
    const key = userAvatarKey(userId, extension);
    if (await fileExists(key)) {
      return { key, extension };
    }
  }

  return null;
}

export async function readStoredAvatar(userId: string) {
  const avatar = await findStoredAvatarKey(userId);
  if (!avatar) {
    return null;
  }

  const bytes = await readFile(avatar.key);
  if (!bytes) {
    return null;
  }

  return { bytes, extension: avatar.extension };
}

export async function deleteStoredAvatars(userId: string) {
  await Promise.all(
    AVATAR_EXTENSIONS.map((extension) =>
      deleteFile(userAvatarKey(userId, extension)),
    ),
  );
}

export function avatarContentType(extension: string) {
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }
  return "image/jpeg";
}

/** Browser-safe avatar URL — proxies private Blob / local files through our API. */
export function getAvatarApiUrl(userId: string, version?: string | number) {
  const base = `/api/files/avatars/${encodeURIComponent(userId)}`;
  return version !== undefined ? `${base}?v=${version}` : base;
}

export function resolveAvatarUrl(
  userId: string,
  storedUrl: string | null | undefined,
): string | null {
  if (!storedUrl) {
    return null;
  }

  const version = storedUrl.match(/[?&]v=(\d+)/)?.[1];
  return getAvatarApiUrl(userId, version);
}
