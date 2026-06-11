"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type BookOption = {
  id: string;
  title: string;
  author: string;
};

export function ComposePost() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [bookQuery, setBookQuery] = useState("");
  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          bookId: selectedBook?.id ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error?.body?.[0] ??
            (typeof data.error === "string" ? data.error : "Could not post."),
        );
        return;
      }

      setBody("");
      setSelectedBook(null);
      setBookQuery("");
      router.refresh();
    } catch {
      setError("Could not post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5"
    >
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Share a thought, quote, or reading update…"
      />

      <div className="mt-4 space-y-3">
        {selectedBook ? (
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-sm">
            <span>
              Tagged: <strong>{selectedBook.title}</strong> by {selectedBook.author}
            </span>
            <button
              type="button"
              onClick={() => setSelectedBook(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove tagged book"
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
              placeholder="Tag a book (optional)"
              className="pl-9"
            />
            {bookOptions.length > 0 ? (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-border/80 bg-card shadow-lg">
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
                    <span className="text-muted-foreground"> · {book.author}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={submitting || !body.trim()}>
          {submitting ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
