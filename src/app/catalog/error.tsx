"use client";

import { AppError } from "@/components/layout/app-error";

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppError
      title="Catalog unavailable"
      description="We couldn't load the book catalog right now."
      error={error}
      reset={reset}
    />
  );
}
