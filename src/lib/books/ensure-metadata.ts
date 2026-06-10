import { lookupBookMetadata } from "@/lib/books/metadata-lookup";
import { normalizeAuthor } from "@/lib/books/metadata-lookup/normalize";
import {
  parseBookSlug,
  readBookMetadata,
  writeBookMetadata,
  type StorageBookMetadata,
} from "@/lib/books/metadata";
import { BookStatus } from "@/lib/constants/book-status";

function authorsDiffer(a: string, b: string) {
  return normalizeAuthor(a).toLowerCase() !== normalizeAuthor(b).toLowerCase();
}

function needsMetadataLookup(
  metadata: StorageBookMetadata | null,
  title: string,
  authorHint: string,
) {
  if (!metadata) {
    return true;
  }

  if (
    authorHint &&
    metadata.author?.trim() &&
    authorsDiffer(metadata.author, authorHint)
  ) {
    return true;
  }

  return (
    !metadata.title?.trim() ||
    !metadata.author?.trim() ||
    !metadata.genres?.length ||
    !metadata.description?.trim()
  );
}

export async function ensureBookMetadata(
  bookId: string,
): Promise<StorageBookMetadata> {
  const { title: slugTitle, authorHint } = parseBookSlug(bookId);
  const existing = await readBookMetadata(bookId);
  const fallbackTitle = slugTitle;

  if (!needsMetadataLookup(existing, fallbackTitle, authorHint)) {
    return {
      ...existing!,
      title: existing!.title ?? fallbackTitle,
      author: existing!.author ?? authorHint,
      genres: existing!.genres ?? [],
      status: existing!.status ?? BookStatus.PUBLISHED,
    };
  }

  const lookupTitle = existing?.title?.trim() || fallbackTitle;
  const lookupAuthor = authorHint || existing?.author || "";

  let external = await lookupBookMetadata(lookupTitle, lookupAuthor);

  if (
    external?.author?.trim() &&
    authorHint &&
    authorsDiffer(external.author, authorHint)
  ) {
    external = null;
  }

  if (!external) {
    const fallback: StorageBookMetadata = {
      title: lookupTitle,
      author: authorHint || existing?.author,
      description: existing?.description,
      genres: existing?.genres ?? [],
      publishedAt: existing?.publishedAt,
      seriesTitle: existing?.seriesTitle,
      seriesIndex: existing?.seriesIndex,
      status: existing?.status ?? BookStatus.PUBLISHED,
    };

    if (
      !existing ||
      (authorHint && authorsDiffer(existing.author ?? "", authorHint))
    ) {
      await writeBookMetadata(bookId, fallback);
    }

    return fallback;
  }

  const merged: StorageBookMetadata = {
    title: lookupTitle,
    author: authorHint || existing?.author?.trim() || external.author?.trim(),
    description:
      existing?.description?.trim() || external.description?.trim(),
    genres:
      existing?.genres?.length ? existing.genres : (external.genres ?? []),
    publishedAt: existing?.publishedAt || external.publishedAt,
    seriesTitle: existing?.seriesTitle,
    seriesIndex: existing?.seriesIndex,
    status: existing?.status ?? BookStatus.PUBLISHED,
  };

  await writeBookMetadata(bookId, merged);

  return merged;
}
