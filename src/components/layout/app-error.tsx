"use client";

import { Button } from "@/components/ui/button";

type AppErrorProps = {
  title?: string;
  description?: string;
  error: Error & { digest?: string };
  reset: () => void;
};

export function AppError({
  title = "Something went wrong",
  description = "An unexpected error occurred. You can try again.",
  error,
  reset,
}: AppErrorProps) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      {process.env.NODE_ENV === "development" ? (
        <p className="mt-4 max-w-full break-words text-xs text-destructive">
          {error.message}
        </p>
      ) : null}
      <Button type="button" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
