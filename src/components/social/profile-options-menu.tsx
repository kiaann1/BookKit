"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Ban, Flag, MoreHorizontal, UserX } from "lucide-react";
import { ReportPostDialog } from "@/components/social/report-post-dialog";
import { Button } from "@/components/ui/button";
import type { PostReportReason } from "@/lib/constants/report-reasons";
import { cn } from "@/lib/utils";

type ProfileOptionsMenuProps = {
  username: string;
  initialBlocked: boolean;
};

export function ProfileOptionsMenu({
  username,
  initialBlocked,
}: ProfileOptionsMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBlocked(initialBlocked);
  }, [initialBlocked]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  async function toggleBlock() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(username)}/block`,
        { method: blocked ? "DELETE" : "POST" },
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not update block status");
        return;
      }

      setBlocked(!blocked);
      setMenuOpen(false);
      router.refresh();
    } catch {
      setError("Could not update block status");
    } finally {
      setLoading(false);
    }
  }

  async function submitReport(reason: PostReportReason, details?: string) {
    const response = await fetch(
      `/api/users/${encodeURIComponent(username)}/report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      },
    );

    if (response.ok) {
      setReported(true);
      return true;
    }

    return false;
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Profile options"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border/80 bg-card py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/50"
              disabled={reported}
              onClick={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
            >
              <Flag className="h-4 w-4 text-muted-foreground" />
              {reported ? "Reported" : "Report user"}
            </button>

            <button
              type="button"
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/50",
                blocked ? "text-foreground" : "text-destructive",
              )}
              disabled={loading}
              onClick={() => void toggleBlock()}
            >
              {blocked ? (
                <>
                  <UserX className="h-4 w-4" />
                  Unblock @{username}
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Block @{username}
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <ReportPostDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
        title="Report user"
        description={`Why are you reporting @${username}?`}
        submitLabel="Submit report"
      />
    </>
  );
}
