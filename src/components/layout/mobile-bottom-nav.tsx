"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
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
  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /^\/catalog\/[^/]+$/.test(pathname);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  if (shouldHideNav(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[3.75rem] max-w-6xl items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors touch-manipulation",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
            >
              {isActive && (
                <span className="absolute inset-x-2 top-1 h-8 rounded-lg bg-primary/10" />
              )}
              <tab.icon
                className={cn("relative h-5 w-5", isActive && "text-primary")}
                strokeWidth={isActive ? 2.25 : 2}
              />
              <span className="relative truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
