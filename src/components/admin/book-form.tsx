"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookStatus } from "@/lib/constants/book-status";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BookFormValues = {
  title: string;
  author: string;
  description: string;
  genres: string[];
  publishedAt: string;
  seriesTitle: string;
  seriesIndex: string;
  status: BookStatus;
};

type BookFormProps = {
  mode: "create" | "edit";
  bookId?: string;
  bookRequestId?: string;
  initialValues?: Partial<BookFormValues>;
};

const defaultValues: BookFormValues = {
  title: "",
  author: "",
  description: "",
  genres: [],
  publishedAt: "",
  seriesTitle: "",
  seriesIndex: "",
  status: BookStatus.PUBLISHED,
};

export function BookForm({
  mode,
  bookId,
  bookRequestId,
  initialValues,
}: BookFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<BookFormValues>({
    ...defaultValues,
    ...initialValues,
  });
  const [pdf, setPdf] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function toggleGenre(genre: string) {
    setValues((current) => ({
      ...current,
      genres: current.genres.includes(genre)
        ? current.genres.filter((item) => item !== genre)
        : [...current.genres, genre],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("author", values.author);
    formData.set("description", values.description);
    formData.set("genres", JSON.stringify(values.genres));
    formData.set("status", values.status);
    if (values.publishedAt) formData.set("publishedAt", values.publishedAt);
    if (values.seriesTitle) formData.set("seriesTitle", values.seriesTitle);
    if (values.seriesIndex) formData.set("seriesIndex", values.seriesIndex);
    if (pdf) formData.set("pdf", pdf);
    if (cover) formData.set("cover", cover);
    if (bookRequestId) formData.set("bookRequestId", bookRequestId);

    try {
      const url =
        mode === "create" ? "/api/admin/books" : `/api/admin/books/${bookId}`;
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const fieldError =
          data.error?.title?.[0] ??
          data.error?.author?.[0] ??
          data.error?.genres?.[0] ??
          data.error?.pdf?.[0] ??
          data.error?.cover?.[0];

        const message =
          fieldError ??
          (typeof data.error === "string" ? data.error : null) ??
          "Something went wrong";

        setError(message);
        return;
      }

      router.push("/admin/books");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {bookRequestId ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Uploading for book request{" "}
          <span className="font-mono text-foreground">{bookRequestId}</span>. This
          request will be marked added when the upload succeeds.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={values.title}
            onChange={(event) =>
              setValues((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={values.author}
            onChange={(event) =>
              setValues((current) => ({ ...current, author: event.target.value }))
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label>Genres</Label>
        <div className="flex flex-wrap gap-2">
          {BOOK_GENRES.map((genre) => {
            const selected = values.genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selected
                    ? "bg-brand-gradient text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {genre}
              </button>
            );
          })}
        </div>
        {values.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {values.genres.map((genre) => (
              <Badge key={genre}>{genre}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="publishedAt">Published date</Label>
          <Input
            id="publishedAt"
            type="date"
            value={values.publishedAt}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                publishedAt: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seriesTitle">Series (optional)</Label>
          <Input
            id="seriesTitle"
            value={values.seriesTitle}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                seriesTitle: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seriesIndex">Book # in series</Label>
          <Input
            id="seriesIndex"
            type="number"
            min={1}
            value={values.seriesIndex}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                seriesIndex: event.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pdf">
            PDF {mode === "edit" && "(leave empty to keep current)"}
          </Label>
          <FileInput
            id="pdf"
            accept="application/pdf"
            required={mode === "create"}
            fileName={pdf?.name}
            onFileChange={setPdf}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover image (optional)</Label>
          <FileInput
            id="cover"
            accept="image/jpeg,image/png,image/webp"
            fileName={cover?.name}
            onFileChange={setCover}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={values.status}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              status: event.target.value as BookStatus,
            }))
          }
          className="flex h-11 w-full rounded-xl border border-border bg-card/50 px-4 text-sm focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <option value={BookStatus.PUBLISHED}>Published</option>
          <option value={BookStatus.DRAFT}>Draft</option>
          <option value={BookStatus.ARCHIVED}>Archived</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Upload book"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/books")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
