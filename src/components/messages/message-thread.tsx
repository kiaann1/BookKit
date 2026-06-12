"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatAvatar } from "@/components/messages/chat-avatar";
import { ChatComposer } from "@/components/messages/chat-composer";
import { ChatHeader } from "@/components/messages/chat-header";
import type { MessageItem } from "@/lib/messages";
import {
  dayKey,
  formatDayDivider,
  formatMessageTime,
} from "@/lib/messages/format";
import { cn } from "@/lib/utils";

type MessageThreadProps = {
  conversationId: string;
  otherUser: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  initialMessages: MessageItem[];
};

export function MessageThread({
  conversationId,
  otherUser,
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

  const groupedMessages = useMemo(() => {
    const groups: { day: string; label: string; items: MessageItem[] }[] = [];

    for (const message of messages) {
      const key = dayKey(message.createdAt);
      const lastGroup = groups[groups.length - 1];

      if (!lastGroup || lastGroup.day !== key) {
        groups.push({
          day: key,
          label: formatDayDivider(message.createdAt),
          items: [message],
        });
      } else {
        lastGroup.items.push(message);
      }
    }

    return groups;
  }, [messages]);

  async function sendMessage() {
    const text = body.trim();
    if (!text || sending) {
      return;
    }

    setError(null);
    setSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, body: text }),
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
          body: text,
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ChatHeader
        displayName={otherUser.displayName}
        username={otherUser.username}
        avatarUrl={otherUser.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/[0.04] via-background to-background px-3 py-4 sm:px-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-medium">Start the conversation</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Say hello to {otherUser.displayName}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map((group) => (
              <div key={group.day} className="space-y-3">
                <div className="flex justify-center">
                  <span className="rounded-full bg-muted/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {group.label}
                  </span>
                </div>

                {group.items.map((message, index) => {
                  const previous = group.items[index - 1];
                  const showAvatar =
                    !message.isOwn &&
                    (!previous || previous.isOwn || previous.senderId !== message.senderId);

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.isOwn ? "justify-end" : "justify-start",
                      )}
                    >
                      {!message.isOwn ? (
                        <div className="w-8 shrink-0">
                          {showAvatar ? (
                            <ChatAvatar
                              src={otherUser.avatarUrl}
                              name={otherUser.displayName}
                              size="sm"
                            />
                          ) : null}
                        </div>
                      ) : null}

                      <div
                        className={cn(
                          "flex max-w-[min(85%,20rem)] flex-col",
                          message.isOwn ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                            message.isOwn
                              ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-2xl rounded-bl-md border border-border/50 bg-card text-foreground",
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                        </div>
                        <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        value={body}
        onChange={setBody}
        onSubmit={() => void sendMessage()}
        sending={sending}
        error={error}
      />
    </div>
  );
}
