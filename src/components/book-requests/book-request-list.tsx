"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookRequestStatusBadge } from "@/components/book-requests/book-request-status-badge";
import { DeleteBookRequestButton } from "@/components/book-requests/delete-book-request-button";
import { Button } from "@/components/ui/button";
import {
  BOOK_REQUEST_STATUS_DESCRIPTIONS,
  type BookRequestStatus,
} from "@/lib/constants/book-request-status";
import type { BookRequestListItem } from "@/lib/book-requests";
import { catalogBookPath } from "@/lib/books/paths";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

type BookRequestListProps = {
  title: string;
  description?: string;
  requests: BookRequestListItem[];
  showRequester?: boolean;
  showVoteButton?: boolean;
  deleteMode?: "owner" | "admin";
  emptyMessage: string;
};

function RequestRow({
  request,
  showRequester,
  showVoteButton,
  deleteMode,
}: {
  request: BookRequestListItem;
  showRequester?: boolean;
  showVoteButton?: boolean;
  deleteMode?: "owner" | "admin";
}) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(request.voteCount);
  const [hasVoted, setHasVoted] = useState(request.viewerHasVoted);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const canVote =
    showVoteButton &&
    (request.status === "PENDING" || request.status === "SOURCED");

  async function toggleVote() {
    if (!canVote || voting) {
      return;
    }

    setVoteError(null);
    setVoting(true);

    try {
      const response = await fetch(
        `/api/book-requests/${encodeURIComponent(request.id)}/vote`,
        { method: "POST" },
      );
      const data = await response.json();

      if (!response.ok) {
        setVoteError(
          typeof data.error === "string" ? data.error : "Could not update vote",
        );
        return;
      }

      const voted = Boolean(data.voted);
      setHasVoted(voted);
      setVoteCount((current) => current + (voted ? 1 : -1));
      router.refresh();
    } catch {
      setVoteError("Could not update vote");
    } finally {
      setVoting(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{request.title}</h3>
            <BookRequestStatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">by {request.author}</p>
          {showRequester && request.requester ? (
            <p className="text-sm text-muted-foreground">
              Requested by{" "}
              <Link
                href={`/u/${request.requester.username}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                @{request.requester.username}
              </Link>
            </p>
          ) : null}
          {request.notes ? (
            <p className="text-sm text-muted-foreground">{request.notes}</p>
          ) : null}
          {request.isbn ? (
            <p className="text-xs text-muted-foreground">ISBN / link: {request.isbn}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {BOOK_REQUEST_STATUS_DESCRIPTIONS[request.status as BookRequestStatus]}
          </p>
          {request.status === "ADDED" && request.linkedBookId ? (
            <Link
              href={catalogBookPath(request.linkedBookId)}
              className="inline-flex text-sm text-primary underline-offset-4 hover:underline"
            >
              Read {request.linkedBookTitle ?? "in catalog"} →
            </Link>
          ) : null}
          {request.adminNote ? (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Admin note: {request.adminNote}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {canVote ? (
            <div className="flex flex-col items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant={hasVoted ? "default" : "outline"}
                disabled={voting}
                onClick={() => void toggleVote()}
                className={cn("min-w-16", hasVoted && "shadow-sm")}
              >
                <ChevronUp className="h-4 w-4" />
                {voteCount}
              </Button>
              <span className="text-xs text-muted-foreground">upvotes</span>
              {voteError ? (
                <p className="max-w-24 text-center text-xs text-destructive">
                  {voteError}
                </p>
              ) : null}
            </div>
          ) : voteCount > 0 ? (
            <div className="text-sm text-muted-foreground">{voteCount} upvotes</div>
          ) : null}

          {deleteMode ? (
            <DeleteBookRequestButton
              requestId={request.id}
              title={request.title}
              variant={deleteMode === "owner" ? "user" : "admin"}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function BookRequestList({
  title,
  description,
  requests,
  showRequester = false,
  showVoteButton = false,
  deleteMode,
  emptyMessage,
}: BookRequestListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-medium">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-5 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              showRequester={showRequester}
              showVoteButton={showVoteButton}
              deleteMode={deleteMode}
            />
          ))}
        </div>
      )}
    </section>
  );
}
