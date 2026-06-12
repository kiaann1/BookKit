"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const POLL_INTERVAL_MS = 30_000;

export function useUnreadMessageCount(enabled = true) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const response = await fetch("/api/messages/unread-count");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { unreadCount: number };
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Ignore transient network errors between polls.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, pathname, refresh]);

  return unreadCount;
}
