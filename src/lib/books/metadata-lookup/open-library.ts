import { mapLabelsToGenres } from "@/lib/books/metadata-lookup/map-genres";
import {
  TITLE_STOP_WORDS,
  authorMatchesHint,
  docKey,
  isMostlyNonLatin,
  normalizeAuthor,
  normalizeTitle,
} from "@/lib/books/metadata-lookup/normalize";
import type {
  ExternalBookMetadata,
  OpenLibraryDoc,
} from "@/lib/books/metadata-lookup/types";

const SEARCH_FIELDS =
  "cover_i,title,author_name,edition_count,first_publish_year,subject,first_sentence";

async function fetchOpenLibraryDocs(
  params: URLSearchParams,
): Promise<OpenLibraryDoc[]> {
  let response: Response;
  try {
    response = await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`,
      {
        headers: {
          "User-Agent": "BookKit/1.0 (reading-app)",
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  try {
    const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
    return data.docs ?? [];
  } catch {
    return [];
  }
}

export async function searchOpenLibraryDocs(title: string, author: string) {
  const normalizedAuthor = normalizeAuthor(author);
  const seen = new Set<string>();
  const docs: OpenLibraryDoc[] = [];

  function addDocs(batch: OpenLibraryDoc[]) {
    for (const doc of batch) {
      const key = docKey(doc);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      docs.push(doc);
    }
  }

  const combinedQuery = new URLSearchParams({
    q: normalizedAuthor ? `${title} ${normalizedAuthor}` : title,
    limit: "20",
    fields: SEARCH_FIELDS,
  });
  addDocs(await fetchOpenLibraryDocs(combinedQuery));

  const titleQuery = new URLSearchParams({
    title: title.trim(),
    limit: "15",
    fields: SEARCH_FIELDS,
  });
  if (normalizedAuthor) {
    titleQuery.set("author", normalizedAuthor);
  }
  addDocs(await fetchOpenLibraryDocs(titleQuery));

  return docs;
}

function scoreDoc(
  doc: OpenLibraryDoc,
  title: string,
  author: string,
  options: { coverRequired?: boolean } = {},
) {
  if (options.coverRequired && !doc.cover_i) {
    return -1;
  }

  const fuzzyTitle = normalizeTitle(title);
  const docTitle = normalizeTitle(doc.title ?? "");
  let score = 0;

  const queryWords = fuzzyTitle.split(" ").filter((word) => word.length > 2);
  const distinctiveWords = queryWords.filter(
    (word) => !TITLE_STOP_WORDS.has(word),
  );

  const exactTitle = docTitle === fuzzyTitle;

  if (exactTitle) {
    score += 100;
  } else if (queryWords.length > 0) {
    const matched = queryWords.filter((word) => docTitle.includes(word)).length;
    score += (matched / queryWords.length) * 60;
  }

  if (
    !exactTitle &&
    fuzzyTitle.length > 0 &&
    (docTitle.startsWith(`${fuzzyTitle} `) || docTitle.startsWith(fuzzyTitle))
  ) {
    const remainder = docTitle.slice(fuzzyTitle.length).trim();
    const extraWords = remainder
      .split(" ")
      .filter((word) => word.length > 2 && !TITLE_STOP_WORDS.has(word));
    score -= extraWords.length * 42;
  }

  if (!isMostlyNonLatin(docTitle) && distinctiveWords.length > 0) {
    const missingDistinctive = distinctiveWords.filter(
      (word) => !docTitle.includes(word),
    );
    score -= missingDistinctive.length * 35;
  }

  const normalizedAuthorValue = normalizeAuthor(author);
  if (
    normalizedAuthorValue &&
    doc.author_name?.some((name) =>
      authorMatchesHint(name, normalizedAuthorValue),
    )
  ) {
    score += 80;
  }

  if (doc.author_name?.length) {
    score += 25;
  }

  if (doc.subject?.length) {
    score += 20;
  }

  if (doc.cover_i) {
    score += 15;
  }

  score += Math.min(doc.edition_count ?? 0, 20) * 4;

  return score;
}

function pickBestDoc(
  docs: OpenLibraryDoc[],
  title: string,
  author: string,
  options: { coverRequired?: boolean } = {},
) {
  const ranked = docs
    .map((doc) => ({ doc, score: scoreDoc(doc, title, author, options) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        (b.doc.first_publish_year ?? 0) - (a.doc.first_publish_year ?? 0)
      );
    });

  if (ranked.length === 0) {
    return null;
  }

  const best = ranked[0];
  const bestTitle = normalizeTitle(best.doc.title ?? "");
  const fuzzyTitle = normalizeTitle(title);
  const hasAuthor = Boolean(normalizeAuthor(author));
  const exactTitle = bestTitle === fuzzyTitle;

  if (!exactTitle) {
    if (!hasAuthor) {
      return null;
    }

    if (best.score < 75) {
      return null;
    }
  }

  if (hasAuthor) {
    const authorMatched = best.doc.author_name?.some((name) =>
      authorMatchesHint(name, author),
    );
    if (!authorMatched) {
      return null;
    }
  }

  if (!normalizeAuthor(author) && !options.coverRequired) {
    const top = ranked[0];
    const topTitle = normalizeTitle(top.doc.title ?? "");
    const fuzzyTitle = normalizeTitle(title);

    if (
      topTitle === fuzzyTitle &&
      (top.doc.edition_count ?? 0) <= 3 &&
      top.doc.author_name?.length
    ) {
      const better = ranked.find(({ doc, score }) => {
        if (doc.cover_i === top.doc.cover_i && doc.title === top.doc.title) {
          return false;
        }

        const sharesAuthor = top.doc.author_name?.some((name) =>
          doc.author_name?.includes(name),
        );
        const established =
          (doc.edition_count ?? 0) >= 10 &&
          (doc.edition_count ?? 0) > (top.doc.edition_count ?? 0) * 5;

        return Boolean(sharesAuthor && established && score >= top.score - 45);
      });

      if (better) {
        return better.doc;
      }
    }
  }

  return best.doc;
}

function extractDescription(doc: OpenLibraryDoc) {
  const firstSentence = doc.first_sentence;
  if (Array.isArray(firstSentence) && firstSentence[0]) {
    return firstSentence[0];
  }
  if (
    firstSentence &&
    typeof firstSentence === "object" &&
    "value" in firstSentence &&
    firstSentence.value
  ) {
    return firstSentence.value;
  }
  return undefined;
}

function docToMetadata(doc: OpenLibraryDoc): ExternalBookMetadata {
  const genres = mapLabelsToGenres(doc.subject ?? []);

  return {
    title: doc.title?.trim(),
    author: doc.author_name?.[0]?.trim(),
    description: extractDescription(doc),
    genres,
    publishedAt: doc.first_publish_year
      ? `${doc.first_publish_year}-01-01`
      : undefined,
    coverId: doc.cover_i,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
    sources: ["open-library"],
  };
}

export async function lookupFromOpenLibrary(
  title: string,
  author: string,
): Promise<ExternalBookMetadata | null> {
  const docs = await searchOpenLibraryDocs(title, author);
  const match = pickBestDoc(docs, title, author);

  if (!match) {
    return null;
  }

  return docToMetadata(match);
}

export type OpenLibraryCoverResult = {
  url: string;
  coverId: number;
};

export type OpenLibraryCoverLookup =
  | OpenLibraryCoverResult
  | { status: "not-found" }
  | { status: "error" };

export async function fetchOpenLibraryCover(
  title: string,
  author: string,
): Promise<OpenLibraryCoverLookup> {
  const docs = await searchOpenLibraryDocs(title, author);
  const match = pickBestDoc(docs, title, author, { coverRequired: true });

  if (!match?.cover_i) {
    return docs.length === 0 ? { status: "error" } : { status: "not-found" };
  }

  return {
    coverId: match.cover_i,
    url: `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`,
  };
}
