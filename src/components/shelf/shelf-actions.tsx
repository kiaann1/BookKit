"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { StarRating } from "@/components/shelf/star-rating";
import { Button } from "@/components/ui/button";
import { readBookPath } from "@/lib/books/paths";
import {
  SHELF_STATUS_LABELS,
  SHELF_STATUS_OPTIONS,
  type ShelfStatus,
} from "@/lib/constants/shelf-status";
import { cn } from "@/lib/utils";

type ShelfActionsProps = {
  bookId: string;
  bookTitle: string;
  initialStatus: ShelfStatus | null;
  initialRating?: number | null;
};

export function ShelfActions({
  bookId,
  bookTitle,
  initialStatus,
  initialRating = null,
}: ShelfActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ShelfStatus | null>(initialStatus);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addToShelf(nextStatus: ShelfStatus) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not add to shelf");
        return;
      }

      setStatus(data.entry.status);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function patchShelf(body: Record<string, unknown>) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/shelf/${encodeURIComponent(bookId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not update shelf entry",
        );
        return false;
      }

      if (data.entry?.status) {
        setStatus(data.entry.status);
      }
      if (data.entry?.rating !== undefined) {
        setRating(data.entry.rating);
      }
      router.refresh();
      return true;
    } catch {
      setError("Something went wrong");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(nextStatus: ShelfStatus) {
    await patchShelf({ status: nextStatus });
  }

  async function updateRating(nextRating: number | null) {
    const previous = rating;
    setRating(nextRating);
    const ok = await patchShelf({ rating: nextRating });
    if (!ok) {
      setRating(previous);
    }
  }

  async function removeFromShelf() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/shelf/${encodeURIComponent(bookId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Could not remove from shelf");
        return;
      }

      setStatus(null);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-5 card-glow">
        <p className="font-medium">Add to your shelf</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save {bookTitle} to track reading progress and status.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
            onClick={() => addToShelf("WANT_TO_READ")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            Want to Read
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
            onClick={() => addToShelf("CURRENTLY_READING")}
            disabled={isLoading}
          >
            Currently Reading
          </Button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <BookmarkCheck className="h-4 w-4" />
            On your shelf
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {SHELF_STATUS_LABELS[status]}
          </p>
        </div>
        <Link href="/shelf">
          <Button variant="outline" size="sm">
            View shelf
          </Button>
        </Link>
      </div>

      <Link href={readBookPath(bookId)} className="mt-4 inline-block">
        <Button size="sm">
          <Bookmark className="h-4 w-4" />
          Read book
        </Button>
      </Link>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Rating</p>
        <StarRating
          value={rating}
          onChange={(value) => void updateRating(value)}
          disabled={isLoading}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SHELF_STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isLoading}
            onClick={() => updateStatus(option.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              status === option.value
                ? "bg-brand-gradient text-white"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 text-muted-foreground hover:text-destructive"
        onClick={removeFromShelf}
        disabled={isLoading}
      >
        Remove from shelf
      </Button>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
