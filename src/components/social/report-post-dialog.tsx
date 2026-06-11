"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  POST_REPORT_REASONS,
  type PostReportReason,
} from "@/lib/constants/report-reasons";
import { cn } from "@/lib/utils";

type ReportPostDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: PostReportReason, details?: string) => Promise<boolean>;
};

export function ReportPostDialog({
  open,
  onClose,
  onSubmit,
}: ReportPostDialogProps) {
  const [selectedReason, setSelectedReason] = useState<PostReportReason | null>(
    null,
  );
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  function reset() {
    setSelectedReason(null);
    setDetails("");
    setError(null);
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!selectedReason) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const success = await onSubmit(
      selectedReason,
      selectedReason === "other" ? details.trim() : undefined,
    );

    setSubmitting(false);

    if (success) {
      reset();
      onClose();
    } else {
      setError("Could not submit report. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close report dialog"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-post-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-background p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="report-post-title" className="font-display text-lg font-semibold">
              Report post
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Why are you reporting this post?
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleClose}
            disabled={submitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ul className="space-y-2">
          {POST_REPORT_REASONS.map((reason) => (
            <li key={reason.value}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                  selectedReason === reason.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-primary/30",
                )}
                onClick={() => setSelectedReason(reason.value)}
              >
                {reason.label}
              </button>
            </li>
          ))}
        </ul>

        {selectedReason === "other" ? (
          <Textarea
            className="mt-3"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            placeholder="Tell us more (optional)…"
            maxLength={500}
          />
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={!selectedReason || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
