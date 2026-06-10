"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type BookCoverImageProps = {
  src: string | null;
  title: string;
  sizes?: string;
  className?: string;
  imageClassName?: string;
};

export function BookCoverImage({
  src,
  title,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
  className,
  imageClassName,
}: BookCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-2 p-4 text-center",
          className,
        )}
      >
        <BookOpen className="h-8 w-8 text-primary/60" />
        <span className="text-xs font-medium text-muted-foreground line-clamp-3">
          {title}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`Cover of ${title}`}
      fill
      className={cn(
        "object-cover transition-transform duration-500 group-hover:scale-105",
        imageClassName,
      )}
      sizes={sizes}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
