"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/settings",
    label: "Profile",
    shortLabel: "Profile",
    icon: UserRound,
    match: (pathname: string) =>
      pathname === "/settings" || pathname === "/settings/",
  },
  {
    href: "/settings/privacy",
    label: "Privacy & data",
    shortLabel: "Privacy",
    icon: Shield,
    match: (pathname: string) => pathname.startsWith("/settings/privacy"),
  },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-2 rounded-2xl border border-border/80 bg-card p-1.5"
      aria-label="Settings sections"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
