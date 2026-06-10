"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SHOWCASE_BOOKS } from "@/lib/constants/shelf";
import type { ShelfBook } from "@/lib/shelf/types";

type ShowcaseManagerProps = {
  initialShowcase: ShelfBook[];
  shelfBooks: ShelfBook[];
};

export function ShowcaseManager({
  initialShowcase,
  shelfBooks,
}: ShowcaseManagerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(
    initialShowcase.map((book) => book.id),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedBooks = selected
    .map((id) => shelfBooks.find((book) => book.id === id))
    .filter((book): book is ShelfBook => Boolean(book));

  const availableToAdd = shelfBooks.filter((book) => !selected.includes(book.id));

  function moveBook(bookId: string, direction: -1 | 1) {
    setSelected((current) => {
      const index = current.indexOf(bookId);
      if (index === -1) {
        return current;
      }

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function addBook(bookId: string) {
    if (selected.length >= MAX_SHOWCASE_BOOKS) {
      setError(`Showcase supports up to ${MAX_SHOWCASE_BOOKS} books`);
      return;
    }
    setError(null);
    setSelected((current) => [...current, bookId]);
  }

  function removeBook(bookId: string) {
    setSelected((current) => current.filter((id) => id !== bookId));
  }

  async function saveShowcase() {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/shelf/showcase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIds: selected }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not update showcase",
        );
        return;
      }

      setMessage("Showcase updated.");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (shelfBooks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add books to your shelf first, then pin favorites here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {selected.length}/{MAX_SHOWCASE_BOOKS} pinned
        </p>
        <Button
          type="button"
          size="sm"
          disabled={isLoading}
          onClick={() => void saveShowcase()}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save showcase
        </Button>
      </div>

      {selectedBooks.length > 0 ? (
        <ul className="space-y-2">
          {selectedBooks.map((book, index) => (
            <li
              key={book.id}
              className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3"
            >
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-primary/15 to-brand-coral/15">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary/60" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{book.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {book.author}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={index === 0 || isLoading}
                  onClick={() => moveBook(book.id, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={index === selectedBooks.length - 1 || isLoading}
                  onClick={() => moveBook(book.id, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  disabled={isLoading}
                  onClick={() => removeBook(book.id)}
                  aria-label="Remove from showcase"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pick books from your shelf to feature on your profile.
        </p>
      )}

      {availableToAdd.length > 0 && selected.length < MAX_SHOWCASE_BOOKS ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Add from shelf
          </p>
          <div className="flex flex-wrap gap-2">
            {availableToAdd.slice(0, 8).map((book) => (
              <Button
                key={book.id}
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => addBook(book.id)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="max-w-[10rem] truncate">{book.title}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
