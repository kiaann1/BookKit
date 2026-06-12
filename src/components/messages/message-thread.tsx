"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageItem } from "@/lib/messages";
import { cn } from "@/lib/utils";

type MessageThreadProps = {
  conversationId: string;
  initialMessages: MessageItem[];
};

export function MessageThread({
  conversationId,
  initialMessages,
}: MessageThreadProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    void fetch(`/api/messages/${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
    });
  }, [conversationId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || sending) {
      return;
    }

    setError(null);
    setSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, body }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : data.error?.body?.[0] ?? "Could not send message",
        );
        return;
      }

      setBody("");
      setMessages((current) => [
        ...current,
        {
          id: data.messageId,
          senderId: "self",
          body: body.trim(),
          readAt: null,
          createdAt: data.createdAt,
          isOwn: true,
        },
      ]);
      router.refresh();
    } catch {
      setError("Could not send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[24rem] flex-col rounded-2xl border border-border/80 bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Say hello — this is the start of your conversation.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isOwn ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                  message.isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {message.body}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border/60 p-4 sm:p-5"
      >
        <div className="space-y-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Write a message…"
            disabled={sending}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={sending || !body.trim()}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
