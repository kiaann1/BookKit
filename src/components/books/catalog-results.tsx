import { BookCard } from "@/components/books/book-card";
import { CatalogFilters } from "@/components/books/catalog-filters";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getCatalogData } from "@/lib/books";
import { getProgressForBooks } from "@/lib/progress";
import { Library } from "lucide-react";

type CatalogResultsProps = {
  q?: string;
  genre?: string;
};

export async function CatalogResults({ q, genre }: CatalogResultsProps) {
  const [{ books, genreOptions }, user] = await Promise.all([
    getCatalogData({ q, genre }),
    getAuthenticatedUser(),
  ]);

  const progressByBookId = user
    ? await getProgressForBooks(
        user.userId,
        books.map((book) => book.id),
      )
    : new Map();

  return (
    <>
      <CatalogFilters
        genreOptions={genreOptions}
        currentQuery={q}
        currentGenre={genre}
      />

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-16 text-center">
          <Library className="mb-4 h-10 w-10 text-primary/60" />
          <p className="font-medium">No books found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q || genre
              ? "Try a different search or genre filter."
              : "Books will appear here once an admin uploads them."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              progress={progressByBookId.get(book.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
