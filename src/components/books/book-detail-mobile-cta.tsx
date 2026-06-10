"use client";

import { ReadBookButton } from "@/components/books/read-book-button";
import { useMediaQuery } from "@/hooks/use-media-query";

type BookDetailMobileCtaProps = {
  bookId: string;
  label: string;
};

export function BookDetailMobileCta({ bookId, label }: BookDetailMobileCtaProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!isMobile) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 p-4 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <ReadBookButton bookId={bookId} label={label} fullWidth />
    </div>
  );
}
