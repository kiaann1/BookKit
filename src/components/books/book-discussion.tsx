"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, MessageSquare, PenLine, Star } from "lucide-react";
import { FriendPostPreview } from "@/components/dashboard/friend-post-preview";
import { BookReviewForm } from "@/components/books/book-review-form";
import { useCompose } from "@/components/social/compose-context";
import { Button } from "@/components/ui/button";
import type { BookDiscussionPage, BookReviewItem } from "@/lib/books/discussion";
import type { ShelfStatus } from "@/lib/constants/shelf-status";
import { cn } from "@/lib/utils";

type BookDiscussionProps = {
  book: {
    id: string;
    title: string;
    author: string;
  };
  discussion: BookDiscussionPage;
  isLoggedIn: boolean;
  shelfStatus?: ShelfStatus | null;
  shelfRating?: number | null;
  shelfReview?: string | null;
};

type DiscussionTab = "all" | "posts" | "reviews";

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function ReviewCard({ review }: { review: BookReviewItem }) {
  return (
    <article className="rounded-xl border border-border/80 bg-card/50 p-4">
      <div className="flex items-start gap-3">
        <Link href={`/u/${review.author.username}`} className="shrink-0">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary/15 to-brand-coral/15">
            {review.author.avatarUrl ? (
              <Image
                src={review.author.avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-primary">
                {review.author.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link
              href={`/u/${review.author.username}`}
              className="font-medium hover:text-primary"
            >
              {review.author.displayName}
            </Link>
            <time
              dateTime={new Date(review.updatedAt).toISOString()}
              className="text-xs text-muted-foreground"
            >
              {formatRelativeTime(review.updatedAt)}
            </time>
          </div>

          {review.rating ? (
            <div className="mt-1 flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "h-3.5 w-3.5",
                    index < review.rating!
                      ? "fill-current"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          ) : null}

          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {review.review}
          </p>
        </div>
      </div>
    </article>
  );
}

export function BookDiscussion({
  book,
  discussion,
  isLoggedIn,
  shelfStatus = null,
  shelfRating = null,
  shelfReview = null,
}: BookDiscussionProps) {
  const { openCompose } = useCompose();
  const [tab, setTab] = useState<DiscussionTab>("all");

  const postCount = discussion.posts.length;
  const reviewCount = discussion.reviews.length;
  const isEmpty = postCount === 0 && reviewCount === 0;

  const showPosts = tab === "all" || tab === "posts";
  const showReviews = tab === "all" || tab === "reviews";

  const tabs: Array<{ id: DiscussionTab; label: string; count: number }> = [
    { id: "all", label: "All", count: postCount + reviewCount },
    { id: "posts", label: "Posts", count: postCount },
    { id: "reviews", label: "Reviews", count: reviewCount },
  ];

  return (
    <section className="mt-10 border-t border-border/80 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Discussion
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Posts and reviews about {book.title}
          </p>
        </div>

        {isLoggedIn ? (
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() =>
              openCompose({
                book: {
                  id: book.id,
                  title: book.title,
                  author: book.author,
                },
              })
            }
          >
            <PenLine className="h-4 w-4" />
            Post about this book
          </Button>
        ) : (
          <Link href="/login">
            <Button size="sm" variant="outline">
              Sign in to join
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition",
              tab === item.id
                ? "border-primary bg-primary/5 font-medium text-primary"
                : "border-border/80 text-muted-foreground hover:border-primary/30",
            )}
          >
            {item.label}
            {item.count > 0 ? ` (${item.count})` : ""}
          </button>
        ))}
      </div>

      {isLoggedIn && (tab === "all" || tab === "reviews") ? (
        <div className="mt-5">
          <BookReviewForm
            bookId={book.id}
            bookTitle={book.title}
            initialStatus={shelfStatus}
            initialRating={shelfRating}
            initialReview={shelfReview}
          />
        </div>
      ) : null}

      {isEmpty ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border/80 px-6 py-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 font-medium">No discussion yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to post or review this book.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {showPosts && postCount > 0 ? (
            <div className="space-y-3">
              {tab === "all" ? (
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Posts
                </h3>
              ) : null}
              {discussion.posts.map((post) => (
                <FriendPostPreview key={post.id} post={post} />
              ))}
            </div>
          ) : null}

          {showReviews && reviewCount > 0 ? (
            <div className="space-y-3">
              {tab === "all" ? (
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Reviews
                </h3>
              ) : null}
              {discussion.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : null}

          {tab === "posts" && postCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No posts about this book yet.
            </p>
          ) : null}

          {tab === "reviews" && reviewCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Write one above.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
