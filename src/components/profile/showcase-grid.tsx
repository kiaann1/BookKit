import Image from "next/image";
import Link from "next/link";
import { catalogBookPath } from "@/lib/books/paths";
import type { ShelfBook } from "@/lib/shelf/types";
import { BookOpen } from "lucide-react";

type ShowcaseGridProps = {
  books: ShelfBook[];
  editable?: boolean;
};

export function ShowcaseGrid({ books, editable = false }: ShowcaseGridProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-10 text-center">
        <p className="font-medium">No showcase books yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {editable
            ? "Pin up to 6 favorites from your shelf to highlight them here."
            : "This reader has not pinned any showcase books."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
      {books.map((book) => (
        <Link
          key={book.id}
          href={catalogBookPath(book.id)}
          className="group block"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-primary/15 to-brand-coral/15 card-glow transition-transform group-hover:-translate-y-0.5">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, 120px"
                unoptimized
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                <BookOpen className="h-6 w-6 text-primary/60" />
                <span className="line-clamp-3 text-[10px] font-medium text-muted-foreground">
                  {book.title}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug group-hover:text-primary">
            {book.title}
          </p>
          {book.rating ? (
            <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
              {"★".repeat(book.rating)}
              {"☆".repeat(5 - book.rating)}
            </p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
