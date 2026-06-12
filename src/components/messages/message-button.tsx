"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type MessageButtonProps = {
  username: string;
};

export function MessageButton({ username }: MessageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startConversation() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUsername: username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not start a conversation",
        );
        return;
      }

      router.push(`/messages/${data.conversationId}`);
    } catch {
      setError("Could not start a conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void startConversation()}
      >
        <MessageCircle className="h-4 w-4" />
        {loading ? "Opening…" : "Message"}
      </Button>
      {error ? (
        <p className="max-w-48 text-right text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
