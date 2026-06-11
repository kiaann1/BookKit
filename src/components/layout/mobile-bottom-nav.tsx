"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Library, Plus, User } from "lucide-react";
import { useCompose } from "@/components/social/compose-context";
import { cn } from "@/lib/utils";

const leftTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
];

const rightTabs = [
  { href: "/shelf", label: "Shelf", icon: Library },
  { href: "/profile", label: "Profile", icon: User },
];

const hiddenPrefixes = [
  "/read",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function shouldHideNav(pathname: string) {
  return hiddenPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function NavTab({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  pathname: string;
}) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors touch-manipulation",
        isActive
          ? "text-primary"
          : "text-muted-foreground active:text-foreground",
      )}
    >
      {isActive && (
        <span className="absolute inset-x-1 top-1 h-8 rounded-lg bg-primary/10" />
      )}
      <Icon
        className={cn("relative h-5 w-5", isActive && "text-primary")}
        strokeWidth={isActive ? 2.25 : 2}
      />
      <span className="relative truncate">{label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openCompose } = useCompose();

  if (shouldHideNav(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[3.75rem] max-w-6xl items-stretch px-1">
        <div className="flex min-w-0 flex-1 items-stretch">
          {leftTabs.map((tab) => (
            <NavTab key={tab.href} {...tab} pathname={pathname} />
          ))}
        </div>

        <div className="flex w-[4.5rem] shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={() => openCompose()}
            aria-label="Create post"
            className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition active:scale-95 touch-manipulation"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-stretch">
          {rightTabs.map((tab) => (
            <NavTab key={tab.href} {...tab} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}
