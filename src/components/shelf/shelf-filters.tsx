"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  SHELF_STATUS_OPTIONS,
  type ShelfStatus,
} from "@/lib/constants/shelf-status";

type ShelfFiltersProps = {
  currentStatus?: ShelfStatus;
  counts: Record<string, number>;
  total: number;
};

export function ShelfFilters({
  currentStatus,
  counts,
  total,
}: ShelfFiltersProps) {
  const items = [
    { value: undefined, label: "All", count: total },
    ...SHELF_STATUS_OPTIONS.map((option) => ({
      value: option.value as ShelfStatus | undefined,
      label: option.label,
      count: counts[option.value] ?? 0,
    })),
  ];

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {items.map((item) => {
        const href = item.value ? `/shelf?status=${item.value}` : "/shelf";
        const isActive = currentStatus === item.value;

        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation sm:px-3 sm:py-1.5 sm:text-xs",
              isActive
                ? "bg-brand-gradient text-white"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                isActive ? "bg-white/20" : "bg-background",
              )}
            >
              {item.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
