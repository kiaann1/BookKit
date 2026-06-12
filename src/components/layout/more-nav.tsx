"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

type MoreNavProps = {
  items: NavItem[];
};

export function MoreNav({ items }: MoreNavProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const isActive = items.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

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

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative hidden md:block" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1 text-sm",
          isActive ? "font-medium text-foreground" : "text-muted-foreground",
        )}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        More
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-40 overflow-hidden rounded-xl border border-border/80 bg-card py-1 shadow-lg">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-4 py-2.5 text-sm transition hover:bg-muted/50",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
