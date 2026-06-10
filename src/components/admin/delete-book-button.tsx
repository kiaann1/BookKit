"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type DeleteBookButtonProps = {
  bookId: string;
  title: string;
};

export function DeleteBookButton({ bookId, title }: DeleteBookButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(`Delete "${title}"? This cannot be undone.`)
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete book");
        return;
      }

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isLoading}
      className="text-destructive hover:text-destructive"
    >
      {isLoading ? "Deleting..." : "Delete"}
    </Button>
  );
}
