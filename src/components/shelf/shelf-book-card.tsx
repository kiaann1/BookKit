import Image from "next/image";
import Link from "next/link";
import type { ShelfBook } from "@/lib/shelf/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SHELF_STATUS_LABELS } from "@/lib/constants/shelf-status";
import { BookOpen } from "lucide-react";

type ShelfBookCardProps = {
  book: ShelfBook;
};

export function ShelfBookCard({ book }: ShelfBookCardProps) {
  const percent = book.progressPercent ?? 0;
  const hasProgress = percent > 0;

  return (
    <div className="group flex gap-3 rounded-xl border border-border/80 bg-card p-3 card-glow transition-transform duration-300 active:scale-[0.99] sm:gap-4 sm:rounded-2xl sm:p-4 sm:hover:-translate-y-0.5">
      <Link href={`/catalog/${book.id}`} className="shrink-0">
        <div className="relative h-32 w-[4.5rem] overflow-hidden rounded-lg bg-gradient-to-br from-primary/15 to-brand-coral/15 sm:h-28 sm:w-20 sm:rounded-xl">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary/60" />
            </div>
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">
            {SHELF_STATUS_LABELS[book.shelfStatus]}
          </Badge>
        </div>
        <Link href={`/catalog/${book.id}`}>
          <h3 className="mt-2 line-clamp-2 font-medium leading-snug group-hover:text-primary">
            {book.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>

        {hasProgress && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{percent}%</span>
              {book.currentPage && book.totalPages ? (
                <span>
                  p. {book.currentPage}/{book.totalPages}
                </span>
              ) : null}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-brand-gradient"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        <Link href={`/read/${book.id}`} className="mt-3 block sm:inline-block">
          <Button
            size="sm"
            variant={hasProgress ? "default" : "outline"}
            className="h-10 w-full touch-manipulation sm:h-9 sm:w-auto"
          >
            {hasProgress ? "Continue" : "Read"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
