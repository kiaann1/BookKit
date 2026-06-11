"use client";

import { Plus } from "lucide-react";
import { useCompose } from "@/components/social/compose-context";
import { cn } from "@/lib/utils";

type ComposeFabProps = {
  className?: string;
  variant?: "nav" | "floating";
};

export function ComposeFab({ className, variant = "floating" }: ComposeFabProps) {
  const { openCompose } = useCompose();

  return (
    <button
      type="button"
      onClick={() => openCompose()}
      aria-label="Create post"
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95 touch-manipulation",
        variant === "nav"
          ? "h-14 w-14 -translate-y-5 border-4 border-background"
          : "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 h-14 w-14 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0",
        className,
      )}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );
}
