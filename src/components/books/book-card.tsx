import Link from "next/link";
import type { BookListItem } from "@/lib/books";
import { BookCoverImage } from "@/components/books/book-cover-image";
import { Badge } from "@/components/ui/badge";

type BookCardProps = {
  book: BookListItem;
};

export function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/catalog/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card card-glow transition-transform duration-300 active:scale-[0.98] sm:rounded-2xl sm:hover-lift"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-primary/15 to-brand-coral/15">
        <BookCoverImage src={book.coverUrl} title={book.title} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug sm:text-base group-hover:text-primary">
            {book.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            {book.author}
          </p>
        </div>

        {book.genres.length > 0 && (
          <div className="mt-auto hidden flex-wrap gap-1.5 sm:flex">
            {book.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="default">
                {genre}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
