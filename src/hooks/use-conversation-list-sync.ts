"use client";

import { useEffect, useState } from "react";
import type { ConversationListItem } from "@/lib/messages";

const POLL_INTERVAL_MS = 4_000;

export function useConversationListSync(
  initialConversations: ConversationListItem[],
  enabled = true,
) {
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible" || cancelled) {
        return;
      }

      try {
        const response = await fetch("/api/messages");
        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as {
          conversations: ConversationListItem[];
        };

        setConversations(data.conversations);
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
  }, [enabled]);

  return conversations;
}
