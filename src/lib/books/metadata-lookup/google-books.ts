import { mapLabelsToGenres } from "@/lib/books/metadata-lookup/map-genres";
import { normalizeAuthor } from "@/lib/books/metadata-lookup/normalize";
import type { ExternalBookMetadata } from "@/lib/books/metadata-lookup/types";

type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    publishedDate?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

function normalizePublishedDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const match = value.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!match) {
    return undefined;
  }

  const [, year, month = "01", day = "01"] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function volumeToMetadata(volume: GoogleVolume): ExternalBookMetadata | null {
  const info = volume.volumeInfo;
  if (!info?.title) {
    return null;
  }

  const thumbnail =
    info.imageLinks?.thumbnail?.replace("http://", "https://") ??
    info.imageLinks?.smallThumbnail?.replace("http://", "https://");

  return {
    title: info.title.trim(),
    author: info.authors?.[0]?.trim(),
    description: info.description?.trim(),
    genres: mapLabelsToGenres(info.categories ?? []),
    publishedAt: normalizePublishedDate(info.publishedDate),
    coverUrl: thumbnail,
    sources: ["google-books"],
  };
}

export function isGoogleBooksConfigured() {
  return Boolean(process.env.GOOGLE_BOOKS_API_KEY?.trim());
}

export async function lookupFromGoogleBooks(
  title: string,
  author: string,
): Promise<ExternalBookMetadata | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const authorPart = normalizeAuthor(author);
  const query = authorPart
    ? `intitle:${title} inauthor:${authorPart}`
    : `intitle:${title}`;

  const params = new URLSearchParams({
    q: query,
    maxResults: "5",
    key: apiKey,
  });

  let response: Response;
  try {
    response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let data: { items?: GoogleVolume[] };
  try {
    data = (await response.json()) as { items?: GoogleVolume[] };
  } catch {
    return null;
  }

  const normalizedTitle = title.trim().toLowerCase();
  const volumes = data.items ?? [];

  const exact = volumes.find(
    (volume) =>
      volume.volumeInfo?.title?.trim().toLowerCase() === normalizedTitle,
  );
  const match = exact ?? volumes[0];

  return match ? volumeToMetadata(match) : null;
}
