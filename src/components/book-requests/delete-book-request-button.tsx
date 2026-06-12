"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteBookRequestButtonProps = {
  requestId: string;
  title: string;
  variant: "user" | "admin";
  className?: string;
  size?: "sm" | "default";
};

export function DeleteBookRequestButton({
  requestId,
  title,
  variant,
  className,
  size = "sm",
}: DeleteBookRequestButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Delete the request for "${title}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const endpoint =
        variant === "admin"
          ? `/api/admin/book-requests/${encodeURIComponent(requestId)}`
          : `/api/book-requests/${encodeURIComponent(requestId)}`;

      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        alert(data.error ?? "Could not delete request");
        return;
      }

      router.refresh();
    } catch {
      alert("Could not delete request");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={deleting}
      onClick={() => void handleDelete()}
      className={cn("text-destructive hover:text-destructive", className)}
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? "Deleting…" : "Delete"}
    </Button>
  );
}
