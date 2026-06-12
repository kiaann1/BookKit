"use client";

import { Loader2 } from "lucide-react";
import {
  SHELF_STATUS_OPTIONS,
  type ShelfStatus,
} from "@/lib/constants/shelf-status";
import { cn } from "@/lib/utils";

type ShelfStatusPickerProps = {
  value: ShelfStatus | null;
  onSelect: (status: ShelfStatus) => void;
  disabled?: boolean;
  loading?: boolean;
  layout?: "grid" | "row";
  size?: "sm" | "md";
};

export function ShelfStatusPicker({
  value,
  onSelect,
  disabled,
  loading,
  layout = "grid",
  size = "md",
}: ShelfStatusPickerProps) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-2 gap-2"
          : "flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide",
      )}
    >
      {SHELF_STATUS_OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled || loading}
            onClick={() => onSelect(option.value)}
            className={cn(
              "rounded-xl border font-medium transition-colors touch-manipulation disabled:opacity-50",
              size === "sm" ? "px-2.5 py-2 text-xs" : "px-3 py-2.5 text-sm",
              layout === "row" && "shrink-0 whitespace-nowrap",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/80 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {loading && isActive ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              option.label
            )}
          </button>
        );
      })}
    </div>
  );
}
