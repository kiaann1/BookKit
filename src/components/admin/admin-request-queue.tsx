"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BookRequestStatusBadge } from "@/components/book-requests/book-request-status-badge";
import { DeleteBookRequestButton } from "@/components/book-requests/delete-book-request-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BOOK_REQUEST_STATUSES,
  BOOK_REQUEST_STATUS_LABELS,
  type BookRequestStatus,
} from "@/lib/constants/book-request-status";
import type { BookRequestListItem } from "@/lib/book-requests";
import { catalogBookPath } from "@/lib/books/paths";
import { cn } from "@/lib/utils";
import { ExternalLink, Upload } from "lucide-react";

type AdminRequestQueueProps = {
  initialRequests: BookRequestListItem[];
};

export function AdminRequestQueue({ initialRequests }: AdminRequestQueueProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<BookRequestStatus | "ALL">("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { status: BookRequestStatus; adminNote: string; linkedBookId: string }>
  >(() =>
    Object.fromEntries(
      initialRequests.map((request) => [
        request.id,
        {
          status: request.status,
          adminNote: request.adminNote ?? "",
          linkedBookId: request.linkedBookId ?? "",
        },
      ]),
    ),
  );

  const filtered = useMemo(() => {
    if (filter === "ALL") {
      return initialRequests;
    }
    return initialRequests.filter((request) => request.status === filter);
  }, [filter, initialRequests]);

  function updateDraft(
    id: string,
    patch: Partial<{ status: BookRequestStatus; adminNote: string; linkedBookId: string }>,
  ) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  async function saveRequest(id: string) {
    const draft = drafts[id];
    if (!draft) {
      return;
    }

    setSavingId(id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/book-requests/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: draft.status,
            adminNote: draft.adminNote.trim() || null,
            linkedBookId: draft.linkedBookId.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : data.error?.linkedBookId?.[0] ??
                data.error?.status?.[0] ??
                "Could not update request",
        );
        return;
      }

      router.refresh();
    } catch {
      setError("Could not update request");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
        >
          All
        </Button>
        {BOOK_REQUEST_STATUSES.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
          >
            {BOOK_REQUEST_STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-medium">No requests in this filter</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reader requests will appear here for triage.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((request) => {
            const draft = drafts[request.id];
            if (!draft) {
              return null;
            }

            return (
              <article
                key={request.id}
                className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{request.title}</h3>
                      <BookRequestStatusBadge status={request.status} />
                      {request.voteCount > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {request.voteCount} upvote
                          {request.voteCount === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      by {request.author}
                    </p>
                    {request.requester ? (
                      <p className="text-sm text-muted-foreground">
                        Requested by @{request.requester.username}
                      </p>
                    ) : null}
                    {request.notes ? (
                      <p className="text-sm">{request.notes}</p>
                    ) : null}
                    {request.isbn ? (
                      <p className="text-xs text-muted-foreground">
                        ISBN / link: {request.isbn}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/books/new?requestId=${request.id}`}>
                      <Button type="button" size="sm" variant="outline">
                        <Upload className="h-4 w-4" />
                        Add to catalog
                      </Button>
                    </Link>
                    {request.linkedBookId ? (
                      <Link href={catalogBookPath(request.linkedBookId)}>
                        <Button type="button" size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                          View book
                        </Button>
                      </Link>
                    ) : null}
                    <DeleteBookRequestButton
                      requestId={request.id}
                      title={request.title}
                      variant="admin"
                    />
                  </div>
                </div>

                <div className="grid gap-4 border-t border-border/60 pt-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {BOOK_REQUEST_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={savingId === request.id}
                          onClick={() => updateDraft(request.id, { status })}
                          className={cn(
                            "rounded-xl border p-3 text-left text-sm transition",
                            draft.status === status
                              ? "border-primary bg-primary/5"
                              : "border-border/80 hover:border-primary/30",
                          )}
                        >
                          {BOOK_REQUEST_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`linked-${request.id}`}>
                        Linked catalog book ID
                      </Label>
                      <Input
                        id={`linked-${request.id}`}
                        value={draft.linkedBookId}
                        onChange={(event) =>
                          updateDraft(request.id, {
                            linkedBookId: event.target.value,
                          })
                        }
                        placeholder="book-slug-id"
                        disabled={savingId === request.id}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`note-${request.id}`}>Internal note</Label>
                      <Textarea
                        id={`note-${request.id}`}
                        value={draft.adminNote}
                        onChange={(event) =>
                          updateDraft(request.id, {
                            adminNote: event.target.value,
                          })
                        }
                        rows={3}
                        disabled={savingId === request.id}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={savingId === request.id}
                      onClick={() => void saveRequest(request.id)}
                    >
                      {savingId === request.id ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
