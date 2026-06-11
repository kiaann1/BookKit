"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ShelfStatus } from "@/lib/constants/shelf-status";

type UseShelfBookOptions = {
  bookId: string;
  initialStatus: ShelfStatus | null;
  initialRating?: number | null;
};

export function useShelfBook({
  bookId,
  initialStatus,
  initialRating = null,
}: UseShelfBookOptions) {
  const router = useRouter();
  const [status, setStatus] = useState<ShelfStatus | null>(initialStatus);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(initialStatus);
    setRating(initialRating ?? null);
  }, [initialStatus, initialRating]);

  async function addToShelf(nextStatus: ShelfStatus) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not add to shelf");
        return false;
      }

      setStatus(data.entry.status);
      router.refresh();
      return true;
    } catch {
      setError("Something went wrong");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function patchShelf(body: Record<string, unknown>) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/shelf/${encodeURIComponent(bookId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not update shelf entry",
        );
        return false;
      }

      if (data.entry?.status) {
        setStatus(data.entry.status);
      }
      if (data.entry?.rating !== undefined) {
        setRating(data.entry.rating);
      }
      router.refresh();
      return true;
    } catch {
      setError("Something went wrong");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(nextStatus: ShelfStatus) {
    if (!status) {
      return addToShelf(nextStatus);
    }

    return patchShelf({ status: nextStatus });
  }

  async function updateRating(nextRating: number | null) {
    const previous = rating;
    setRating(nextRating);
    const ok = await patchShelf({ rating: nextRating });
    if (!ok) {
      setRating(previous);
    }
  }

  async function removeFromShelf() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/shelf/${encodeURIComponent(bookId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Could not remove from shelf");
        return false;
      }

      setStatus(null);
      router.refresh();
      return true;
    } catch {
      setError("Something went wrong");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    status,
    rating,
    isLoading,
    error,
    addToShelf,
    updateStatus,
    updateRating,
    removeFromShelf,
  };
}
