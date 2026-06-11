"use client";

import { ONBOARDING_GENRE_GROUPS } from "@/lib/constants/genres";
import { cn } from "@/lib/utils";

type GenrePickerProps = {
  value: string[];
  onChange: (genres: string[]) => void;
  max?: number;
  disabled?: boolean;
};

export function GenrePicker({
  value,
  onChange,
  max = 8,
  disabled = false,
}: GenrePickerProps) {
  function toggleGenre(genre: string) {
    if (disabled) {
      return;
    }

    if (value.includes(genre)) {
      onChange(value.filter((item) => item !== genre));
      return;
    }

    if (value.length >= max) {
      return;
    }

    onChange([...value, genre]);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        {value.length}/{max} selected — tap to toggle.
      </p>
      {ONBOARDING_GENRE_GROUPS.map((group) => (
        <div key={group.label} className="space-y-3">
          <h3 className="text-sm font-medium">{group.label}</h3>
          <div className="flex flex-wrap gap-2">
            {group.genres.map((genre) => {
              const selected = value.includes(genre);
              const atLimit = !selected && value.length >= max;

              return (
                <button
                  key={genre}
                  type="button"
                  disabled={disabled || atLimit}
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 hover:border-primary/40",
                  )}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
