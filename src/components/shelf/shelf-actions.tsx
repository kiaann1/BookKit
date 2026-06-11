"use client";

import Link from "next/link";
import { BookmarkCheck } from "lucide-react";
import { StarRating } from "@/components/shelf/star-rating";
import { ShelfStatusPicker } from "@/components/shelf/shelf-status-picker";
import { Button } from "@/components/ui/button";
import { readBookPath } from "@/lib/books/paths";
import {
  SHELF_STATUS_LABELS,
  type ShelfStatus,
} from "@/lib/constants/shelf-status";
import { useShelfBook } from "@/hooks/use-shelf-book";

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
  const {
    status,
    rating,
    isLoading,
    error,
    updateStatus,
    updateRating,
    removeFromShelf,
  } = useShelfBook({ bookId, initialStatus, initialRating });

  if (!status) {
    return (
      <div className="hidden rounded-2xl border border-border/80 bg-card p-5 card-glow md:block">
        <p className="font-medium">Add to your shelf</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save {bookTitle} to track reading progress and status.
        </p>
        <div className="mt-4">
          <ShelfStatusPicker
            value={null}
            onSelect={(nextStatus) => void updateStatus(nextStatus)}
            disabled={isLoading}
            loading={isLoading}
          />
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

      <Link
        href={readBookPath(bookId)}
        className="mt-4 hidden md:inline-block"
      >
        <Button size="sm">Read book</Button>
      </Link>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Rating</p>
        <StarRating
          value={rating}
          onChange={(value) => void updateRating(value)}
          disabled={isLoading}
        />
      </div>

      <div className="mt-4 hidden md:block">
        <ShelfStatusPicker
          value={status}
          onSelect={(nextStatus) => void updateStatus(nextStatus)}
          disabled={isLoading}
          loading={isLoading}
          layout="row"
          size="sm"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 hidden text-muted-foreground hover:text-destructive md:inline-flex"
        onClick={() => void removeFromShelf()}
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
