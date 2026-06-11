import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";
import type { RecommendedBook } from "@/lib/recommendations/types";

type RecommendationSectionProps = {
  title: string;
  description?: string;
  books: RecommendedBook[];
  emptyMessage?: string;
  settingsHref?: string;
};

export function RecommendationSection({
  title,
  description,
  books,
  emptyMessage,
  settingsHref,
}: RecommendationSectionProps) {
  if (books.length === 0) {
    if (!emptyMessage) {
      return null;
    }

    return (
      <section className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-10 text-center">
        <h2 className="font-medium">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
        {settingsHref ? (
          <Link href={settingsHref} className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Update genre preferences
            </Button>
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} reason={book.reason} />
        ))}
      </div>
    </section>
  );
}

type RecommendationRowProps = {
  title: string;
  description?: string;
  books: RecommendedBook[];
  href: string;
  linkLabel?: string;
};

export function RecommendationRow({
  title,
  description,
  books,
  href,
  linkLabel = "See all",
}: RecommendationRowProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Link href={href} className="shrink-0">
          <Button variant="ghost" size="sm" className="gap-1">
            {linkLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {books.slice(0, 4).map((book) => (
          <BookCard key={book.id} book={book} reason={book.reason} />
        ))}
      </div>
    </section>
  );
}
