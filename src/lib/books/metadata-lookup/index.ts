import { lookupFromGoogleBooks } from "@/lib/books/metadata-lookup/google-books";
import { lookupFromOpenLibrary } from "@/lib/books/metadata-lookup/open-library";
import type { ExternalBookMetadata } from "@/lib/books/metadata-lookup/types";

export type { ExternalBookMetadata } from "@/lib/books/metadata-lookup/types";

export function isMetadataLookupEnabled() {
  return process.env.DISABLE_METADATA_LOOKUP !== "true";
}

function mergeMetadata(
  primary: ExternalBookMetadata | null,
  secondary: ExternalBookMetadata | null,
): ExternalBookMetadata | null {
  if (!primary && !secondary) {
    return null;
  }

  const sources = [
    ...(primary?.sources ?? []),
    ...(secondary?.sources ?? []),
  ];

  return {
    title: primary?.title ?? secondary?.title,
    author: primary?.author ?? secondary?.author,
    description: primary?.description ?? secondary?.description,
    genres:
      primary?.genres?.length ? primary.genres : secondary?.genres,
    publishedAt: primary?.publishedAt ?? secondary?.publishedAt,
    coverId: primary?.coverId ?? secondary?.coverId,
    coverUrl: primary?.coverUrl ?? secondary?.coverUrl,
    sources: Array.from(new Set(sources)),
  };
}

export async function lookupBookMetadata(
  title: string,
  author = "",
): Promise<ExternalBookMetadata | null> {
  if (!isMetadataLookupEnabled()) {
    return null;
  }

  const [openLibrary, googleBooks] = await Promise.all([
    lookupFromOpenLibrary(title, author),
    lookupFromGoogleBooks(title, author),
  ]);

  let merged = mergeMetadata(openLibrary, googleBooks);

  if (!merged) {
    return null;
  }

  if (!merged.author && googleBooks?.author && openLibrary) {
    merged = mergeMetadata(openLibrary, googleBooks) ?? merged;
  }

  if (!merged) {
    return null;
  }

  if (!merged.genres?.length && googleBooks?.genres?.length && openLibrary) {
    merged = {
      ...merged,
      genres: googleBooks.genres,
      sources: Array.from(
        new Set([...(merged.sources ?? []), "google-books"]),
      ),
    };
  }

  if (!merged.coverUrl && googleBooks?.coverUrl) {
    merged = {
      ...merged,
      coverUrl: googleBooks.coverUrl,
      sources: Array.from(
        new Set([...(merged.sources ?? []), "google-books"]),
      ),
    };
  }

  return merged;
}
