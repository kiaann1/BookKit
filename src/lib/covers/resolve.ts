import { lookupFromGoogleBooks } from "@/lib/books/metadata-lookup/google-books";
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
  if (cached) {
    return cached;
  }

  if (cached === null) {
    const googleOnly = await lookupFromGoogleBooks(title, author);
    if (googleOnly?.coverUrl) {
      await setCachedCoverUrl(title, author, googleOnly.coverUrl);
      return googleOnly.coverUrl;
    }
    return null;
  }

  const result = await fetchOpenLibraryCover(title, author);

  if (!("status" in result)) {
    await setCachedCoverUrl(title, author, result.url);
    return result.url;
  }

  const google = await lookupFromGoogleBooks(title, author);
  if (google?.coverUrl) {
    await setCachedCoverUrl(title, author, google.coverUrl);
    return google.coverUrl;
  }

  await setCachedCoverUrl(title, author, null);
  return null;
}
