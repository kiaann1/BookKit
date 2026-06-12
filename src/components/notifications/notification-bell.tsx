"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { presentNotification } from "@/lib/notifications/present";
import type { NotificationItem } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=15");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        notifications: NotificationItem[];
        unreadCount: number;
      };

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      void loadNotifications();
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, loadNotifications]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnreadCount(0);
    setNotifications((current) =>
      current.map((item) => ({ ...item, readAt: new Date().toISOString() })),
    );
  }

  async function openNotification(notification: NotificationItem) {
    const presentation = presentNotification(notification);

    if (!notification.readAt) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [notification.id] }),
      });
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    setOpen(false);
    router.push(presentation.href);
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="relative"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/25 sm:hidden"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />

          <div
            className={cn(
              "z-50 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg",
              "fixed inset-x-4 top-[calc(3.5rem+env(safe-area-inset-top,0px)+0.5rem)] max-h-[calc(100dvh-5rem-var(--mobile-nav-height)-env(safe-area-inset-bottom,0px))]",
              "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-none",
            )}
          >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto sm:max-h-80">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  const presentation = presentNotification(notification);
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => void openNotification(notification)}
                        className={cn(
                          "w-full border-b border-border/40 px-4 py-3 text-left transition hover:bg-muted/40",
                          !notification.readAt && "bg-primary/5",
                        )}
                      >
                        <p className="text-sm font-medium">{presentation.title}</p>
                        {presentation.body ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {presentation.body}
                          </p>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="shrink-0 border-t border-border/60 px-4 py-2">
            <Link
              href="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
