"use client";

import { motion } from "framer-motion";
import { BookMarked, BookOpen } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type PublicProfilePreview = {
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  genres: string[];
  readingPaceLabel?: string;
};

type PublicProfileCardProps = {
  profile: PublicProfilePreview;
  className?: string;
  animate?: boolean;
};

export function PublicProfileCard({
  profile,
  className,
  animate = false,
}: PublicProfileCardProps) {
  const CardWrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? {
        initial: { opacity: 0, y: 48, rotate: -10, scale: 0.92 },
        animate: { opacity: 1, y: 0, rotate: -5, scale: 1 },
        transition: { duration: 0.7, ease, delay: 0.15 },
      }
    : {};

  return (
    <div
      className={cn("perspective-[1200px]", className)}
      style={{ perspective: "1200px" }}
    >
      <CardWrapper
        {...wrapperProps}
        className="relative mx-auto w-full max-w-sm"
      >
        <div
          className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/30 via-brand-coral/20 to-brand-gold/20 blur-2xl"
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 to-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="mb-5 flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Public profile
            </span>
            <BookMarked className="h-4 w-4 text-primary/80" />
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-white/25 bg-white/10 shadow-lg ring-4 ring-primary/20">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={`${profile.displayName}'s avatar`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/20 text-2xl font-semibold text-white/80">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <p className="font-display text-xl font-semibold tracking-tight text-white">
              {profile.displayName}
            </p>
            <p className="mt-1 font-mono text-sm text-primary-foreground/90">
              @{profile.username}
            </p>

            {profile.bio?.trim() ? (
              <p className="auth-shell-copy mt-4 text-sm leading-relaxed text-white/85">
                {profile.bio.trim()}
              </p>
            ) : (
              <p className="auth-shell-hint mt-4 text-sm italic">
                No bio yet — your story&apos;s still being written.
              </p>
            )}
          </div>

          {profile.genres.length > 0 ? (
            <div className="mt-6">
              <p className="auth-shell-hint mb-2 text-center text-[11px] font-medium uppercase tracking-[0.16em]">
                Favourite genres
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {profile.genres.slice(0, 6).map((genre) => (
                  <Badge
                    key={genre}
                    variant="default"
                    className="border-white/10 bg-white/10 text-white/90"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {profile.readingPaceLabel ? (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/75">
              <BookOpen className="h-3.5 w-3.5 text-brand-gold" />
              <span>Reads {profile.readingPaceLabel.toLowerCase()}</span>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
            {["Shelf", "Reading", "Finished"].map((label) => (
              <div
                key={label}
                className="rounded-xl bg-white/5 px-2 py-2 text-center"
              >
                <p className="text-sm font-semibold text-white">0</p>
                <p className="text-[10px] text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </CardWrapper>
    </div>
  );
}
