"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import type { GenreFilterOption } from "@/lib/constants/genres";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CatalogFiltersProps = {
  genreOptions: GenreFilterOption[];
  currentQuery?: string;
  currentGenre?: string;
};

function GenreOptionList({
  genreOptions,
  currentGenre,
  onSelect,
}: {
  genreOptions: GenreFilterOption[];
  currentGenre: string;
  onSelect: (genre: string | null) => void;
}) {
  return (
    <>
      <button
        type="button"
        role="option"
        aria-selected={!currentGenre}
        onClick={() => onSelect(null)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors touch-manipulation sm:py-2.5",
          !currentGenre
            ? "bg-primary/10 text-foreground"
            : "text-muted-foreground active:bg-muted active:text-foreground",
        )}
      >
        <span className="font-medium">All genres</span>
        {!currentGenre && <Check className="h-4 w-4 shrink-0 text-primary" />}
      </button>

      {genreOptions.map((option) => {
        const isActive = currentGenre === option.genre;

        return (
          <button
            key={option.genre}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(option.genre)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors touch-manipulation sm:py-2.5",
              isActive
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground active:bg-muted active:text-foreground",
            )}
          >
            <span className="font-medium">{option.genre}</span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
              {isActive && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </span>
          </button>
        );
      })}
    </>
  );
}

export function CatalogFilters({
  genreOptions,
  currentQuery = "",
  currentGenre = "",
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genrePanelRef = useRef<HTMLDivElement>(null);

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      router.push(`/catalog?${params.toString()}`);
    });
  }

  function onSearchChange(value: string) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      pushParams({ q: value || null });
    }, 350);
  }

  function selectGenre(genre: string | null) {
    pushParams({ genre });
    setIsGenreOpen(false);
  }

  useEffect(() => {
    if (!isGenreOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onPointerDown(event: MouseEvent) {
      if (
        genrePanelRef.current &&
        !genrePanelRef.current.contains(event.target as Node)
      ) {
        setIsGenreOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsGenreOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isGenreOpen]);

  const activeGenreLabel =
    genreOptions.find((option) => option.genre === currentGenre)?.genre ??
    currentGenre;

  return (
    <div className={cn("space-y-2.5 sm:space-y-3", isPending && "opacity-70")}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={`search-${currentQuery}`}
            type="search"
            placeholder="Search title or author"
            defaultValue={currentQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 pl-10 text-base sm:text-sm"
          />
        </div>

        {genreOptions.length > 0 && (
          <div className="relative shrink-0" ref={genrePanelRef}>
            <Button
              type="button"
              variant={currentGenre ? "default" : "outline"}
              className="h-11 min-w-11 gap-2 px-3 sm:min-w-0 sm:px-4"
              aria-expanded={isGenreOpen}
              aria-haspopup="listbox"
              onClick={() => setIsGenreOpen((open) => !open)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Genres</span>
              {currentGenre && (
                <span className="hidden max-w-[6rem] truncate text-xs sm:inline">
                  · {activeGenreLabel}
                </span>
              )}
            </Button>

            {isGenreOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close genre filter"
                  className="fixed inset-0 z-50 bg-foreground/25 md:hidden"
                  onClick={() => setIsGenreOpen(false)}
                />

                <div
                  role="listbox"
                  aria-label="Filter by genre"
                  className={cn(
                    "z-50 overflow-hidden border border-border/80 bg-card shadow-lg shadow-black/10",
                    "fixed inset-x-0 bottom-0 max-h-[min(70dvh,28rem)] rounded-t-2xl",
                    "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:mt-2 md:max-h-none md:w-[min(100vw-2rem,18rem)] md:rounded-2xl",
                  )}
                  style={{
                    paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
                  }}
                >
                  <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                    <p className="text-sm font-medium">Filter by genre</p>
                    <button
                      type="button"
                      onClick={() => setIsGenreOpen(false)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors active:bg-muted active:text-foreground"
                      aria-label="Close genre filter"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-[50dvh] overflow-y-auto overscroll-contain p-2 md:max-h-72">
                    <GenreOptionList
                      genreOptions={genreOptions}
                      currentGenre={currentGenre}
                      onSelect={selectGenre}
                    />
                  </div>

                  {currentGenre && (
                    <div className="border-t border-border/80 p-2">
                      <button
                        type="button"
                        onClick={() => selectGenre(null)}
                        className="w-full rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors active:bg-muted active:text-foreground sm:py-2"
                      >
                        Clear genre filter
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {currentGenre && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => selectGenre(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors active:bg-primary/15"
          >
            {activeGenreLabel}
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
