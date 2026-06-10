"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookMarked, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeaturedCover } from "@/lib/home/featured-covers";
import { ease, staggerContainer, staggerItem } from "@/lib/motion";

type HomeHeroProps = {
  isLoggedIn: boolean;
  featuredCovers: FeaturedCover[];
  coverCount: number;
};

const floatingLayouts = [
  { rotate: -14, x: -100, y: 48, z: 1, delay: 0, scale: 0.92 },
  { rotate: 10, x: 55, y: 16, z: 2, delay: 0.12, scale: 1 },
  { rotate: -5, x: -35, y: 76, z: 3, delay: 0.22, scale: 0.96 },
  { rotate: 16, x: 85, y: 88, z: 0, delay: 0.08, scale: 0.88 },
  { rotate: -8, x: 5, y: -8, z: 2, delay: 0.28, scale: 0.94 },
];

function PlaceholderFloatingCard({
  layout,
  index,
}: {
  layout: (typeof floatingLayouts)[number];
  index: number;
}) {
  return (
    <motion.div
      className="absolute h-44 w-32 rounded-xl border border-border/80 bg-card card-glow"
      style={{
        left: "50%",
        marginLeft: layout.x - 64,
        top: layout.y,
        zIndex: layout.z,
      }}
      initial={{ opacity: 0, y: 40, rotate: layout.rotate, scale: layout.scale }}
      animate={{
        opacity: 1,
        y: [layout.y, layout.y - 10, layout.y],
        rotate: layout.rotate,
        scale: layout.scale,
      }}
      transition={{
        opacity: { duration: 0.5, delay: 0.3 + layout.delay },
        y: {
          duration: 4 + index,
          repeat: Infinity,
          ease: "easeInOut",
          delay: layout.delay,
        },
      }}
    >
      <div className="h-28 rounded-t-xl bg-brand-gradient opacity-80" />
      <div className="space-y-2 p-3">
        <div className="h-2 w-3/4 rounded-full bg-muted" />
        <div className="h-2 w-1/2 rounded-full bg-muted" />
      </div>
    </motion.div>
  );
}

function CoverFloatingCard({
  cover,
  layout,
  index,
}: {
  cover: FeaturedCover;
  layout: (typeof floatingLayouts)[number];
  index: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: "50%",
        marginLeft: layout.x - 70,
        top: layout.y,
        zIndex: layout.z,
      }}
      initial={{ opacity: 0, y: 40, rotate: layout.rotate, scale: layout.scale }}
      animate={{
        opacity: 1,
        y: [layout.y, layout.y - 12, layout.y],
        rotate: layout.rotate,
        scale: layout.scale,
      }}
      transition={{
        opacity: { duration: 0.5, delay: 0.3 + layout.delay },
        y: {
          duration: 4.5 + index * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: layout.delay,
        },
      }}
    >
      <Link
        href={`/catalog/${cover.id}`}
        className="group relative block h-48 w-36 overflow-hidden rounded-xl border border-border/80 bg-card shadow-lg shadow-primary/10 card-glow transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/20"
      >
        <Image
          src={cover.coverUrl}
          alt={`Cover of ${cover.title}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="144px"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-10">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
            {cover.title}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function HomeHero({
  isLoggedIn,
  featuredCovers,
  coverCount,
}: HomeHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const floatingCovers = featuredCovers.slice(0, floatingLayouts.length);

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-10">
      <div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-44 h-64 w-64 rounded-full bg-brand-coral/10 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
        <motion.div
          variants={prefersReducedMotion ? undefined : staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Social reading, reimagined
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="font-display mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]"
          >
            Your bookshelf.{" "}
            <span className="text-brand-gradient">Your community.</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground"
          >
            Read in-browser, track your progress, discover books by genre, and
            share what you&apos;re reading with people who get it.
          </motion.p>

          {coverCount > 0 && (
            <motion.p
              variants={staggerItem}
              className="mt-4 text-sm font-medium text-foreground/80"
            >
              {coverCount} titles in the library — refreshed picks every visit.
            </motion.p>
          )}

          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg">Get started free</Button>
                </Link>
                <Link href="/catalog">
                  <Button size="lg" variant="outline">
                    Browse catalog
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>

        <div className="relative mx-auto mt-6 flex h-[22rem] w-full max-w-md items-center justify-center sm:mt-8 lg:mt-0 lg:h-[26rem] lg:max-w-none">
          {!prefersReducedMotion &&
            (floatingCovers.length > 0
              ? floatingCovers.map((cover, index) => (
                  <CoverFloatingCard
                    key={cover.id}
                    cover={cover}
                    layout={floatingLayouts[index]}
                    index={index}
                  />
                ))
              : floatingLayouts.map((layout, index) => (
                  <PlaceholderFloatingCard
                    key={index}
                    layout={layout}
                    index={index}
                  />
                )))}

          {prefersReducedMotion && floatingCovers.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {floatingCovers.slice(0, 3).map((cover) => (
                <Link
                  key={cover.id}
                  href={`/catalog/${cover.id}`}
                  className="relative h-40 w-28 overflow-hidden rounded-lg border border-border/80"
                >
                  <Image
                    src={cover.coverUrl}
                    alt={`Cover of ${cover.title}`}
                    fill
                    className="object-cover"
                    sizes="112px"
                    unoptimized
                  />
                </Link>
              ))}
            </div>
          )}

          {floatingCovers.length === 0 && (
            <motion.div
              className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-gradient shadow-xl shadow-primary/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease, delay: 0.2 }}
            >
              <BookMarked className="h-10 w-10 text-white" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
