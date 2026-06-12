"use client";

import { useEffect, useRef, useState } from "react";
import type { MessageItem } from "@/lib/messages";
import { mergeMessages } from "@/lib/messages/merge";

const POLL_INTERVAL_MS = 2_500;

type UseConversationSyncOptions = {
  conversationId: string;
  initialMessages: MessageItem[];
  enabled?: boolean;
};

export function useConversationSync({
  conversationId,
  initialMessages,
  enabled = true,
}: UseConversationSyncOptions) {
  const [messages, setMessages] = useState(initialMessages);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const lastMessageIdRef = useRef(initialMessages.at(-1)?.id ?? null);

  useEffect(() => {
    setMessages(initialMessages);
    lastMessageIdRef.current = initialMessages.at(-1)?.id ?? null;
  }, [initialMessages]);

  useEffect(() => {
    if (!enabled || !conversationId) {
      return;
    }

    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible" || cancelled) {
        return;
      }

      const params = new URLSearchParams();
      if (lastMessageIdRef.current) {
        params.set("after", lastMessageIdRef.current);
      }

      try {
        const response = await fetch(
          `/api/messages/${encodeURIComponent(conversationId)}?${params.toString()}`,
        );

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as {
          messages: MessageItem[];
          typing?: { active: boolean };
        };

        setOtherUserTyping(Boolean(data.typing?.active));

        if (data.messages.length > 0) {
          if (data.messages.some((message) => !message.isOwn)) {
            void fetch(`/api/messages/${encodeURIComponent(conversationId)}`, {
              method: "PATCH",
            });
          }

          setMessages((current) => {
            const merged = mergeMessages(current, data.messages);
            lastMessageIdRef.current = merged.at(-1)?.id ?? lastMessageIdRef.current;
            return merged;
          });
        }
      } catch {
        // Ignore transient network errors between polls.
      }
    }

    void poll();
    const intervalId = window.setInterval(() => void poll(), POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void poll();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversationId, enabled]);

  function syncLastMessageId(nextMessages: MessageItem[]) {
    lastMessageIdRef.current = nextMessages.at(-1)?.id ?? null;
    setMessages(nextMessages);
  }

  return {
    messages,
    setMessages: syncLastMessageId,
    otherUserTyping,
  };
}
