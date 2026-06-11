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
};

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
  const { open, initialType, initialBook, closeCompose } = useCompose();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<PostType>("TEXT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [bookQuery, setBookQuery] = useState("");
  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPostType(initialType ?? "TEXT");
      setSelectedBook(initialBook);
      setBookQuery("");
      setBookOptions([]);
      setError(null);
    }
  }, [open, initialType, initialBook]);

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
      return;
    }

    const timer = setTimeout(async () => {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(bookQuery.trim())}`,
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { books: BookOption[] };
      setBookOptions(data.books);
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

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close composer"
        className="absolute inset-0 bg-foreground/40"
        onClick={closeCompose}
      />

      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border/80 bg-background shadow-2xl sm:rounded-3xl">
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

            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                Attach a book
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Let readers know which book you&apos;re talking about.
              </p>

              {selectedBook ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                  <span>
                    <strong>{selectedBook.title}</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      by {selectedBook.author}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove attached book"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={bookQuery}
                    onChange={(event) => setBookQuery(event.target.value)}
                    placeholder="Search by title or author…"
                    className="bg-background pl-9"
                  />
                  {bookOptions.length > 0 ? (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border/80 bg-card shadow-lg">
                      {bookOptions.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                          onClick={() => {
                            setSelectedBook(book);
                            setBookQuery("");
                            setBookOptions([]);
                          }}
                        >
                          <span className="font-medium">{book.title}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {book.author}
                          </span>
                        </button>
                      ))}
                    </div>
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
