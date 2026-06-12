"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Loader2, Share2, Trash2 } from "lucide-react";
import { useCompose } from "@/components/social/compose-context";
import { StarRating } from "@/components/shelf/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SHELF_STATUS_OPTIONS,
  ShelfStatus,
  type ShelfStatus as ShelfStatusType,
} from "@/lib/constants/shelf-status";
import type { ShelfBook } from "@/lib/shelf/types";
import { cn } from "@/lib/utils";

type ShelfBookCardActionsProps = {
  book: ShelfBook;
};

function toDateInputValue(date: Date | null) {
  if (!date) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function formatShortDate(date: Date | null) {
  if (!date) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ShelfBookCardActions({ book }: ShelfBookCardActionsProps) {
  const router = useRouter();
  const { openCompose } = useCompose();
  const [status, setStatus] = useState(book.shelfStatus);
  const [rating, setRating] = useState<number | null>(book.rating);
  const [startedAt, setStartedAt] = useState(toDateInputValue(book.startedAt));
  const [finishedAt, setFinishedAt] = useState(
    toDateInputValue(book.finishedAt),
  );
  const [showDates, setShowDates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchShelf(body: Record<string, unknown>) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/shelf/${encodeURIComponent(book.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "Could not update shelf entry";
        setError(message);
        return false;
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

  async function updateStatus(nextStatus: ShelfStatusType) {
    const ok = await patchShelf({ status: nextStatus });
    if (ok) {
      setStatus(nextStatus);
    }
  }

  async function updateRating(nextRating: number | null) {
    const previous = rating;
    setRating(nextRating);
    const ok = await patchShelf({ rating: nextRating });
    if (!ok) {
      setRating(previous);
    }
  }

  async function saveDates() {
    await patchShelf({
      startedAt: startedAt || null,
      finishedAt: finishedAt || null,
    });
  }

  async function removeFromShelf() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/shelf/${encodeURIComponent(book.id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Could not remove from shelf");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const startedLabel = formatShortDate(book.startedAt);
  const finishedLabel = formatShortDate(book.finishedAt);

  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
      <div className="flex flex-wrap gap-1.5">
        {SHELF_STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isLoading}
            onClick={() => void updateStatus(option.value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-50 sm:text-xs",
              status === option.value
                ? "bg-brand-gradient text-white"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating
          value={rating}
          onChange={(value) => void updateRating(value)}
          disabled={isLoading}
        />
        {book.showcaseOrder ? (
          <span className="text-[10px] font-medium text-primary sm:text-xs">
            Showcase #{book.showcaseOrder}
          </span>
        ) : null}
      </div>

      {(startedLabel || finishedLabel) && !showDates ? (
        <p className="text-[10px] text-muted-foreground sm:text-xs">
          {startedLabel ? `Started ${startedLabel}` : null}
          {startedLabel && finishedLabel ? " · " : null}
          {finishedLabel ? `Finished ${finishedLabel}` : null}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setShowDates((open) => !open)}
        className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground sm:text-xs"
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", showDates && "rotate-180")}
        />
        {showDates ? "Hide dates" : "Edit dates"}
      </button>

      {showDates ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`started-${book.id}`} className="text-xs">
              Started
            </Label>
            <Input
              id={`started-${book.id}`}
              type="date"
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
              disabled={isLoading}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`finished-${book.id}`} className="text-xs">
              Finished
            </Label>
            <Input
              id={`finished-${book.id}`}
              type="date"
              value={finishedAt}
              onChange={(event) => setFinishedAt(event.target.value)}
              disabled={isLoading}
              className="h-9"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="sm:col-span-2"
            disabled={isLoading}
            onClick={() => void saveDates()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save dates
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {status === ShelfStatus.CURRENTLY_READING ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs"
            disabled={isLoading}
            onClick={() =>
              openCompose({
                book: {
                  id: book.id,
                  title: book.title,
                  author: book.author,
                },
                body: `Currently reading ${book.title} 📖`,
              })
            }
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
          disabled={isLoading}
          onClick={() => void removeFromShelf()}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
