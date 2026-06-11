"use client";

import Link from "next/link";
import { ReadBookButton } from "@/components/books/read-book-button";
import { ShelfStatusPicker } from "@/components/shelf/shelf-status-picker";
import { Button } from "@/components/ui/button";
import { useShelfBook } from "@/hooks/use-shelf-book";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ShelfStatus } from "@/lib/constants/shelf-status";

type BookDetailMobileCtaProps = {
  bookId: string;
  bookTitle: string;
  label: string;
  initialStatus: ShelfStatus | null;
  isLoggedIn: boolean;
};

export function BookDetailMobileCta({
  bookId,
  bookTitle,
  label,
  initialStatus,
  isLoggedIn,
}: BookDetailMobileCtaProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { status, isLoading, error, updateStatus } = useShelfBook({
    bookId,
    initialStatus,
  });

  if (!isMobile) {
    return null;
  }

  return (
    <div className="book-detail-mobile-cta fixed inset-x-0 z-30 border-t border-border/80 bg-background/95 px-4 pb-4 pt-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto max-w-6xl space-y-3">
        {isLoggedIn ? (
          <>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {status ? "On your shelf" : "Add to your shelf"}
              </p>
              <ShelfStatusPicker
                value={status}
                onSelect={(nextStatus) => void updateStatus(nextStatus)}
                disabled={isLoading}
                loading={isLoading}
                layout={status ? "row" : "grid"}
                size="sm"
              />
            </div>

            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <ReadBookButton bookId={bookId} label={label} fullWidth />
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in to add {bookTitle} to your shelf and read in BookKit.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
              <ReadBookButton
                bookId={bookId}
                label={label}
                fullWidth
                variant="default"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
