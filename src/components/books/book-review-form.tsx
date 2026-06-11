"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRating } from "@/components/shelf/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import { useShelfBook } from "@/hooks/use-shelf-book";

type BookReviewFormProps = {
  bookId: string;
  bookTitle: string;
  initialStatus: ShelfStatus | null;
  initialRating: number | null;
  initialReview: string | null;
};

export function BookReviewForm({
  bookId,
  bookTitle,
  initialStatus,
  initialRating,
  initialReview,
}: BookReviewFormProps) {
  const router = useRouter();
  const { status, rating, isLoading, error, addToShelf, updateRating } =
    useShelfBook({
      bookId,
      initialStatus,
      initialRating,
    });

  const [review, setReview] = useState(initialReview ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveReview() {
    if (!review.trim()) {
      return;
    }

    setSaveError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/shelf/${encodeURIComponent(bookId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: review.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveError(
          typeof data.error === "string"
            ? data.error
            : "Could not save your review",
        );
        return;
      }

      router.refresh();
    } catch {
      setSaveError("Could not save your review");
    } finally {
      setSubmitting(false);
    }
  }

  if (!status) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
        <p className="text-sm font-medium">Write a review</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add {bookTitle} to your shelf to leave a rating and review.
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-3"
          disabled={isLoading}
          onClick={() => void addToShelf("WANT_TO_READ")}
        >
          Add to shelf
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card/50 p-4">
      <p className="text-sm font-medium">Your review</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Share what you thought about {bookTitle}.
      </p>

      <div className="mt-3">
        <StarRating
          value={rating}
          onChange={(value) => void updateRating(value)}
          disabled={isLoading}
        />
      </div>

      <Textarea
        className="mt-3"
        value={review}
        onChange={(event) => setReview(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="What did you think of this book?"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {review.length}/2000
        </p>
        <Button
          type="button"
          size="sm"
          disabled={submitting || !review.trim()}
          onClick={() => void saveReview()}
        >
          {submitting ? "Saving…" : "Save review"}
        </Button>
      </div>

      {(error || saveError) && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {saveError ?? error}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Reviews appear on this book&apos;s discussion tab.{" "}
        <Link href="/shelf" className="text-primary hover:underline">
          Manage shelf
        </Link>
      </p>
    </div>
  );
}
