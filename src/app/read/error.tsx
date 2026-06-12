"use client";

import { AppError } from "@/components/layout/app-error";

export default function ReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppError
      title="Reader error"
      description="We couldn't open the reader. Your progress is still saved."
      error={error}
      reset={reset}
    />
  );
}
