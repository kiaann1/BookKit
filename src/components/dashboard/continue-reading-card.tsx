import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ReadBookButton } from "@/components/books/read-book-button";
import { Button } from "@/components/ui/button";
import type { ShelfBook } from "@/lib/shelf/types";

type ContinueReadingCardProps = {
  book: ShelfBook | null;
};

export function ContinueReadingCard({ book }: ContinueReadingCardProps) {
  if (!book) {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-4 card-glow sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-md shadow-primary/20">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <h2 className="font-medium">Continue reading</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Resume your current book.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing in progress yet.
        </p>
        <Link href="/catalog" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            Browse catalog
          </Button>
        </Link>
      </div>
    );
  }

  const percent = book.progressPercent ?? 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-primary/20 bg-card p-4 card-glow sm:rounded-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-60" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-brand-coral/15">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary/60" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Continue reading
          </p>
          <h2 className="mt-1 line-clamp-2 font-medium">{book.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>

          {percent > 0 && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{percent}% complete</span>
                {book.currentPage && book.totalPages ? (
                  <span>
                    Page {book.currentPage} of {book.totalPages}
                  </span>
                ) : null}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-brand-gradient transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <ReadBookButton
              bookId={book.id}
              label={percent > 0 ? "Continue reading" : "Start reading"}
              size="sm"
              fullWidth
              className="sm:w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
