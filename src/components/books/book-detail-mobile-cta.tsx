"use client";

import { ReadBookButton } from "@/components/books/read-book-button";
import { ShelfStatusPicker } from "@/components/shelf/shelf-status-picker";
import { useShelfBook } from "@/hooks/use-shelf-book";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ShelfStatus } from "@/lib/constants/shelf-status";

type BookDetailMobileCtaProps = {
  bookId: string;
  label: string;
  initialStatus: ShelfStatus | null;
};

export function BookDetailMobileCta({
  bookId,
  label,
  initialStatus,
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
    <div
      className="fixed inset-x-0 z-30 border-t border-border/80 bg-background/95 px-4 pt-3 backdrop-blur-xl md:hidden"
      style={{
        bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-3">
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
      </div>
    </div>
  );
}
