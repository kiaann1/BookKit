import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookDetailMobileCta } from "@/components/books/book-detail-mobile-cta";
import { ReadBookButton } from "@/components/books/read-book-button";
import { ShelfActions } from "@/components/shelf/shelf-actions";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getPublishedBookById } from "@/lib/books";
import { catalogBookPath, resolveBookId } from "@/lib/books/paths";
import { getReadingProgress } from "@/lib/progress";
import { getShelfEntry } from "@/lib/shelf";

type BookDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getPublishedBookById(id);
  if (!book) {
    return { title: "Book not found" };
  }
  return {
    title: book.title,
    description: book.description ?? `By ${book.author}`,
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  const book = await getPublishedBookById(id);

  if (!book) {
    notFound();
  }

  const canonicalBookId = resolveBookId(book.id);
  if (resolveBookId(id) !== canonicalBookId || id !== canonicalBookId) {
    redirect(catalogBookPath(canonicalBookId));
  }

  const user = await getAuthenticatedUser();
  const [shelfEntry, progress] = user
    ? await Promise.all([
        getShelfEntry(user.userId, id),
        getReadingProgress(user.userId, id),
      ])
    : [null, null];

  return (
    <div className="main-with-sticky-cta mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-10 md:pb-10">
      <FadeIn>
        <Link
          href="/catalog"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors active:text-foreground sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
          <div className="flex items-start gap-4 lg:flex-col lg:items-center">
          <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-primary/15 to-brand-coral/15 card-glow sm:w-36 lg:mx-auto lg:w-full lg:max-w-[280px] lg:rounded-2xl">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover"
                sizes="280px"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <BookOpen className="h-12 w-12 text-primary/60" />
                <span className="text-sm font-medium text-muted-foreground">
                  {book.title}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5 lg:hidden">
            <h1 className="font-display text-xl font-semibold leading-tight tracking-tight">
              {book.title}
            </h1>
            <p className="text-sm text-muted-foreground">by {book.author}</p>
            {book.seriesTitle && (
              <p className="text-xs text-muted-foreground">
                {book.seriesTitle}
                {book.seriesIndex ? ` · Book ${book.seriesIndex}` : ""}
              </p>
            )}
          </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="hidden lg:block">
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {book.title}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">by {book.author}</p>

              {book.seriesTitle && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {book.seriesTitle}
                  {book.seriesIndex ? ` · Book ${book.seriesIndex}` : ""}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {book.genres.map((genre) => (
                <Badge key={genre}>{genre}</Badge>
              ))}
            </div>

            {book.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Published{" "}
                {book.publishedAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}

            {book.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {book.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description yet.
              </p>
            )}

            {user ? (
              <ShelfActions
                bookId={book.id}
                bookTitle={book.title}
                initialStatus={shelfEntry?.status ?? null}
                initialRating={shelfEntry?.rating ?? null}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-5">
                <p className="text-sm font-medium">Sign in to save books</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add {book.title} to your shelf to track reading status.
                </p>
                <Link href="/login" className="mt-4 inline-block">
                  <Button size="sm">Sign in</Button>
                </Link>
              </div>
            )}

            {user ? (
              <div className="hidden rounded-2xl border border-border/80 bg-card p-5 card-glow md:block">
                <p className="font-medium">Read in BookKit</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open the book in your browser. Progress saves automatically as
                  you read.
                </p>
                {progress && progress.progressPercent > 0 && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{progress.progressPercent}% complete</span>
                      <span>
                        Page {progress.currentPage} of {progress.totalPages}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-brand-gradient"
                        style={{ width: `${progress.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <ReadBookButton
                    bookId={book.id}
                    label={
                      progress && progress.progressPercent > 0
                        ? "Continue reading"
                        : "Start reading"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 p-5">
                <p className="text-sm font-medium">In-browser reading</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to read this book inside BookKit with saved progress.
                </p>
                <Link href="/login" className="mt-4 inline-block">
                  <Button size="sm">Sign in to read</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {user && (
        <BookDetailMobileCta
          bookId={book.id}
          initialStatus={shelfEntry?.status ?? null}
          label={
            progress && progress.progressPercent > 0
              ? "Continue reading"
              : "Start reading"
          }
        />
      )}
    </div>
  );
}
