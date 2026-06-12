"use client";

import { AppError } from "@/components/layout/app-error";

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppError
      title="Feed unavailable"
      description="We couldn't load your feed right now."
      error={error}
      reset={reset}
    />
  );
}
