"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  FileText,
  ImageIcon,
  Search,
  Type,
  Video,
  X,
} from "lucide-react";
import { useCompose } from "@/components/social/compose-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ARTICLE_BODY_MAX_CHARS,
  ARTICLE_TITLE_MAX_CHARS,
  IMAGE_CAPTION_MAX_CHARS,
  POST_TYPE_OPTIONS,
  TEXT_POST_MAX_CHARS,
  VIDEO_CAPTION_MAX_CHARS,
  type PostType,
} from "@/lib/constants/post-types";
import { cn } from "@/lib/utils";

type BookOption = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
};

function bookCoverUrl(book: { id: string; coverUrl?: string | null }) {
  return book.coverUrl ?? `/api/files/covers/${encodeURIComponent(book.id)}`;
}

function BookCoverThumb({
  book,
  className,
}: {
  book: { id: string; coverUrl?: string | null };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/10 to-brand-coral/10",
        className,
      )}
    >
      <Image
        src={bookCoverUrl(book)}
        alt=""
        fill
        className="object-cover"
        sizes="40px"
        unoptimized
      />
    </div>
  );
}

const TYPE_ICONS: Record<PostType, typeof Type> = {
  TEXT: Type,
  IMAGE: ImageIcon,
  ARTICLE: FileText,
  VIDEO: Video,
};

function bodyLimitForType(type: PostType) {
  switch (type) {
    case "TEXT":
      return TEXT_POST_MAX_CHARS;
    case "IMAGE":
      return IMAGE_CAPTION_MAX_CHARS;
    case "VIDEO":
      return VIDEO_CAPTION_MAX_CHARS;
    case "ARTICLE":
      return ARTICLE_BODY_MAX_CHARS;
  }
}

export function ComposePostSheet() {
  const router = useRouter();
  const { open, initialType, initialBook, initialBody, closeCompose } =
    useCompose();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<PostType>("TEXT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [bookQuery, setBookQuery] = useState("");
  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPostType(initialType ?? "TEXT");
      setSelectedBook(initialBook);
      setBody(initialBody ?? "");
      setBookQuery("");
      setBookOptions([]);
      setError(null);
    }
  }, [open, initialType, initialBook, initialBody]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setMediaFile(null);
      setMediaPreview(null);
      setBookQuery("");
      setBookOptions([]);
      setSelectedBook(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  useEffect(() => {
    if (!bookQuery.trim() || selectedBook) {
      setBookOptions([]);
      setSearchingBooks(false);
      return;
    }

    setSearchingBooks(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/books/search?q=${encodeURIComponent(bookQuery.trim())}`,
        );
        if (!response.ok) {
          setBookOptions([]);
          return;
        }
        const data = (await response.json()) as { books: BookOption[] };
        setBookOptions(data.books);
      } finally {
        setSearchingBooks(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [bookQuery, selectedBook]);

  function selectMedia(file: File | null) {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaFile(file);
    setMediaPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const usesMultipart =
        postType === "IMAGE" || postType === "VIDEO" || mediaFile;

      if (usesMultipart) {
        const formData = new FormData();
        formData.set("type", postType);
        formData.set("body", body.trim());
        if (postType === "ARTICLE") {
          formData.set("title", title.trim());
        }
        if (selectedBook) {
          formData.set("bookId", selectedBook.id);
        }
        if (mediaFile) {
          formData.set("media", mediaFile);
        }

        const response = await fetch("/api/posts", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error?.body?.[0] ??
              data.error?.title?.[0] ??
              (typeof data.error === "string" ? data.error : "Could not post."),
          );
          return;
        }
      } else {
        const payload =
          postType === "ARTICLE"
            ? {
                type: "ARTICLE" as const,
                title: title.trim(),
                body: body.trim(),
                bookId: selectedBook?.id ?? null,
              }
            : {
                type: "TEXT" as const,
                body: body.trim(),
                bookId: selectedBook?.id ?? null,
              };

        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error?.body?.[0] ??
              data.error?.title?.[0] ??
              (typeof data.error === "string" ? data.error : "Could not post."),
          );
          return;
        }
      }

      closeCompose();
      router.refresh();
    } catch {
      setError("Could not post.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  const bodyLimit = bodyLimitForType(postType);
  const requiresMedia = postType === "IMAGE" || postType === "VIDEO";
  const canSubmit =
    !submitting &&
    (postType === "ARTICLE"
      ? title.trim() && body.trim()
      : postType === "TEXT"
        ? body.trim()
        : requiresMedia
          ? Boolean(mediaFile)
          : true);

  const isBookTaggingExpanded =
    Boolean(selectedBook) ||
    bookQuery.trim().length > 0 ||
    bookOptions.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close composer"
        className="absolute inset-0 bg-foreground/40"
        onClick={closeCompose}
      />

      <div
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border/80 bg-background shadow-2xl transition-[max-height,min-height] duration-300 ease-out sm:rounded-3xl",
          isBookTaggingExpanded
            ? "max-h-[92dvh] min-h-[min(92dvh,36rem)]"
            : "max-h-[90dvh] min-h-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <h2 className="font-medium">Create post</h2>
          <button
            type="button"
            onClick={closeCompose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-4 gap-2 border-b border-border/80 p-3">
            {POST_TYPE_OPTIONS.map((option) => {
              const Icon = TYPE_ICONS[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPostType(option.value);
                    selectMedia(null);
                    setError(null);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] transition",
                    postType === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/80 text-muted-foreground hover:border-primary/30",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {postType === "ARTICLE" ? (
              <div className="space-y-2">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Article title"
                  maxLength={ARTICLE_TITLE_MAX_CHARS}
                />
              </div>
            ) : null}

            {requiresMedia ? (
              <div className="space-y-3">
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={
                    postType === "IMAGE"
                      ? "image/jpeg,image/png,image/webp,image/gif"
                      : "video/mp4,video/webm"
                  }
                  className="hidden"
                  onChange={(event) => {
                    selectMedia(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
                {mediaPreview ? (
                  <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/20">
                    {postType === "IMAGE" ? (
                      <div className="relative aspect-[4/5] max-h-72 w-full">
                        <Image
                          src={mediaPreview}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="max-h-72 w-full bg-black"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => selectMedia(null)}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow"
                      aria-label="Remove media"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    {postType === "IMAGE" ? "Choose photo" : "Choose video"}
                  </Button>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={postType === "ARTICLE" ? 8 : 4}
                maxLength={bodyLimit}
                placeholder={
                  postType === "TEXT"
                    ? "What's on your mind?"
                    : postType === "ARTICLE"
                      ? "Write your article…"
                      : "Add a caption (optional)"
                }
              />
              <p className="text-right text-xs text-muted-foreground">
                {body.length}/{bodyLimit}
              </p>
            </div>

            <div
              className={cn(
                "rounded-xl border border-border/80 bg-muted/20 p-3 transition-colors",
                selectedBook && "border-primary/25 bg-primary/5",
              )}
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                Attach a book
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Let readers know which book you&apos;re talking about.
              </p>

              {selectedBook ? (
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-background/80 p-2.5">
                  <BookCoverThumb book={selectedBook} className="h-14 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {selectedBook.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {selectedBook.author}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    aria-label="Remove attached book"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={bookQuery}
                      onChange={(event) => setBookQuery(event.target.value)}
                      placeholder="Search by title or author…"
                      className="bg-background pl-9"
                    />
                  </div>

                  {searchingBooks ? (
                    <p className="px-1 text-xs text-muted-foreground">
                      Searching catalog…
                    </p>
                  ) : bookQuery.trim().length > 0 && bookOptions.length === 0 ? (
                    <p className="px-1 text-xs text-muted-foreground">
                      No books found.
                    </p>
                  ) : null}

                  {bookOptions.length > 0 ? (
                    <ul className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border/80 bg-card p-1">
                      {bookOptions.map((book) => (
                        <li key={book.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-muted/50"
                            onClick={() => {
                              setSelectedBook(book);
                              setBookQuery("");
                              setBookOptions([]);
                            }}
                          >
                            <BookCoverThumb
                              book={book}
                              className="h-12 w-9"
                            />
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-medium leading-snug">
                                {book.title}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {book.author}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {error ? (
            <p className="px-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="border-t border-border/80 p-4">
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {submitting ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
