import Link from "next/link";
import { ShelfBookCard } from "@/components/shelf/shelf-book-card";
import { ShelfFilters } from "@/components/shelf/shelf-filters";
import { Button } from "@/components/ui/button";
import { getUserShelf } from "@/lib/shelf";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import { Library } from "lucide-react";

type ShelfContentProps = {
  userId: string;
  status?: ShelfStatus;
};

export async function ShelfContent({ userId, status }: ShelfContentProps) {
  const allBooks = await getUserShelf(userId);
  const books = status
    ? allBooks.filter((book) => book.shelfStatus === status)
    : allBooks;

  const counts = allBooks.reduce<Record<string, number>>((acc, book) => {
    acc[book.shelfStatus] = (acc[book.shelfStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <ShelfFilters
        currentStatus={status}
        counts={counts}
        total={allBooks.length}
      />

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-16 text-center">
          <Library className="mb-4 h-10 w-10 text-primary/60" />
          <p className="font-medium">
            {status ? "No books with this status" : "Your shelf is empty"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {status
              ? "Try another filter or add more books from the catalog."
              : "Browse the catalog and add books you want to read."}
          </p>
          <Link href="/catalog" className="mt-4">
            <Button>Browse catalog</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {books.map((book) => (
            <ShelfBookCard key={book.shelfEntryId} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
