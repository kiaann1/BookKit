"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, Home, MessageCircle, User } from "lucide-react";
import { ComposeFab } from "@/components/social/compose-fab";
import { useUnreadMessageCount } from "@/hooks/use-unread-message-count";
import { cn } from "@/lib/utils";

const leftTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
] as const;

const rightTabs = [
  { href: "/messages", label: "Messages", icon: MessageCircle },
] as const;

const hiddenPrefixes = [
  "/read",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function shouldHideNav(pathname: string) {
  if (pathname === "/messages") {
    return false;
  }

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return pathname.startsWith("/messages/");
}

function NavTab({
  href,
  label,
  icon: Icon,
  isActive,
  badgeCount = 0,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: boolean;
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-label={
        badgeCount > 0 ? `${label}, ${badgeCount} unread` : undefined
      }
      className={cn(
        "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors touch-manipulation",
        isActive ? "text-primary" : "text-muted-foreground active:text-foreground",
      )}
    >
      {isActive ? (
        <>
          <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-brand-gradient" />
          <span className="absolute inset-1 rounded-xl bg-primary/10" />
        </>
      ) : null}
      <span className="relative">
        <Icon
          className={cn("relative h-[1.35rem] w-[1.35rem]", isActive && "text-primary")}
          strokeWidth={isActive ? 2.35 : 2}
        />
        {badgeCount > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground shadow-sm">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span className={cn("relative max-w-full truncate", isActive && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const unreadMessageCount = useUnreadMessageCount(Boolean(session));
  const username = session?.user?.username;
  const profileHref = username ? `/u/${username}` : "/profile";

  if (shouldHideNav(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden dark:shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[3.85rem] max-w-6xl items-stretch px-1">
        <div className="flex min-w-0 flex-1 items-stretch">
          {leftTabs.map((tab) => (
            <NavTab
              key={tab.href}
              {...tab}
              isActive={
                pathname === tab.href || pathname.startsWith(`${tab.href}/`)
              }
            />
          ))}
        </div>

        <div className="flex w-[4.5rem] shrink-0 items-center justify-center">
          <ComposeFab variant="nav" />
        </div>

        <div className="flex min-w-0 flex-1 items-stretch">
          {rightTabs.map((tab) => (
            <NavTab
              key={tab.href}
              {...tab}
              isActive={pathname === "/messages"}
              badgeCount={unreadMessageCount}
            />
          ))}
          <NavTab
            href={profileHref}
            label="Profile"
            icon={User}
            isActive={
              username
                ? pathname === profileHref || pathname.startsWith(`${profileHref}/`)
                : pathname === "/profile" || pathname.startsWith("/profile/")
            }
          />
        </div>
      </div>
    </nav>
  );
}
