"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number | null;
  onChange?: (value: number | null) => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function StarRating({
  value,
  onChange,
  disabled = false,
  size = "sm",
}: StarRatingProps) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="inline-flex items-center gap-0.5" role="group" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const filled = value !== null && starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled || !onChange}
            onClick={() => {
              if (!onChange) {
                return;
              }
              onChange(value === starValue ? null : starValue);
            }}
            className={cn(
              "rounded p-0.5 transition-colors disabled:cursor-default",
              onChange && !disabled && "hover:text-amber-500",
              filled ? "text-amber-500" : "text-muted-foreground/40",
            )}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
          >
            <Star
              className={iconClass}
              fill={filled ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}
