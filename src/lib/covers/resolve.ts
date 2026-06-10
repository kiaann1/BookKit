import { fetchOpenLibraryCover } from "@/lib/covers/open-library";
import { getCachedCoverUrl, setCachedCoverUrl } from "@/lib/covers/cache";

export function isCoverLookupEnabled() {
  return process.env.DISABLE_COVER_LOOKUP !== "true";
}

export async function resolveExternalCoverUrl(title: string, author: string) {
  if (!isCoverLookupEnabled()) {
    return null;
  }

  const cached = await getCachedCoverUrl(title, author);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fetchOpenLibraryCover(title, author);

  if ("status" in result) {
    if (result.status === "error") {
      return null;
    }

    await setCachedCoverUrl(title, author, null);
    return null;
  }

  await setCachedCoverUrl(title, author, result.url);
  return result.url;
}
