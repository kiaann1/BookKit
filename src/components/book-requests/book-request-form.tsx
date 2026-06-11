"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BookRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [notes, setNotes] = useState("");
  const [isbn, setIsbn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const response = await fetch("/api/book-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          notes: notes.trim() || null,
          isbn: isbn.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const fieldError =
          data.error?.title?.[0] ??
          data.error?.author?.[0] ??
          data.error?.notes?.[0] ??
          data.error?.isbn?.[0];
        setError(
          fieldError ??
            (typeof data.error === "string"
              ? data.error
              : "Could not submit your request."),
        );
        return;
      }

      setTitle("");
      setAuthor("");
      setNotes("");
      setIsbn("");
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border/80 bg-card p-5 sm:p-6"
    >
      <div>
        <h2 className="font-medium">Request a title</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what you want to read. Admins review requests and add books to
          the catalog when they can source them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="request-title">Title</Label>
          <Input
            id="request-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="request-author">Author</Label>
          <Input
            id="request-author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            required
            maxLength={120}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-isbn">ISBN or link (optional)</Label>
        <Input
          id="request-isbn"
          value={isbn}
          onChange={(event) => setIsbn(event.target.value)}
          maxLength={32}
          placeholder="978… or a helpful link"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-notes">Notes (optional)</Label>
        <Textarea
          id="request-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Edition, why you want it, or where you heard about it"
          disabled={submitting}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-primary" role="status">
          Request submitted. We&apos;ll update your list below as admins review
          it.
        </p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
