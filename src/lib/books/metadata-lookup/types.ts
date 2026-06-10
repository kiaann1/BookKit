export type ExternalBookMetadata = {
  title?: string;
  author?: string;
  description?: string;
  genres?: string[];
  publishedAt?: string;
  coverId?: number;
  coverUrl?: string;
  sources: Array<"open-library" | "google-books">;
};

export type OpenLibraryDoc = {
  cover_i?: number;
  title?: string;
  author_name?: string[];
  edition_count?: number;
  first_publish_year?: number;
  subject?: string[];
  first_sentence?: string[] | { value?: string };
};
