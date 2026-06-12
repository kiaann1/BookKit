"use client";

import { useEffect } from "react";

const TYPING_DEBOUNCE_MS = 400;
const TYPING_PING_MS = 3_000;

export function useTypingPresence(
  conversationId: string,
  draft: string,
  sending: boolean,
) {
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const endpoint = `/api/messages/${encodeURIComponent(conversationId)}/typing`;
    const hasDraft = draft.trim().length > 0;

    if (!hasDraft || sending) {
      void fetch(endpoint, { method: "DELETE" });
      return;
    }

    let debounceId = 0;
    let pingId = 0;

    function pingTyping() {
      void fetch(endpoint, { method: "POST" });
    }

    debounceId = window.setTimeout(() => {
      pingTyping();
      pingId = window.setInterval(pingTyping, TYPING_PING_MS);
    }, TYPING_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(debounceId);
      window.clearInterval(pingId);
      void fetch(endpoint, { method: "DELETE" });
    };
  }, [conversationId, draft, sending]);
}
