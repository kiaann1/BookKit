"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  username: string;
  authDisabled: boolean;
  isAdmin: boolean;
};

export function UserMenu({ username, authDisabled, isAdmin }: UserMenuProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const profileActive =
    pathname === `/u/${username}` ||
    pathname.startsWith(`/u/${username}/`);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative hidden sm:block" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="max-w-[9rem] gap-1 truncate text-sm"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">@{username}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border/80 bg-card py-1 shadow-lg"
        >
          <Link
            href={`/u/${username}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted/50",
              profileActive
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted/50",
              pathname.startsWith("/settings")
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/books"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted/50",
                pathname.startsWith("/admin")
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          {!authDisabled ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-muted/50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
