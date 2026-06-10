"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookMarked, Compass, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ease, fadeUp, staggerContainer, staggerItem } from "@/lib/motion";

type HomeHeroProps = {
  isLoggedIn: boolean;
};

const floatingCards = [
  { rotate: -6, x: -20, delay: 0 },
  { rotate: 4, x: 10, delay: 0.15 },
  { rotate: -2, x: 30, delay: 0.3 },
];

export function HomeHero({ isLoggedIn }: HomeHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
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

        <div className="relative mx-auto flex h-72 w-full max-w-sm items-center justify-center lg:h-80 lg:max-w-none">
          {!prefersReducedMotion &&
            floatingCards.map((card, index) => (
              <motion.div
                key={index}
                className="absolute h-44 w-32 rounded-xl border border-border/80 bg-card card-glow"
                style={{
                  left: "50%",
                  marginLeft: card.x - 64,
                }}
                initial={{ opacity: 0, y: 40, rotate: card.rotate }}
                animate={{
                  opacity: 1,
                  y: [0, -10, 0],
                  rotate: card.rotate,
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.3 + card.delay },
                  y: {
                    duration: 4 + index,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: card.delay,
                  },
                }}
              >
                <div className="h-24 rounded-t-xl bg-brand-gradient opacity-80" />
                <div className="space-y-2 p-3">
                  <div className="h-2 w-3/4 rounded-full bg-muted" />
                  <div className="h-2 w-1/2 rounded-full bg-muted" />
                </div>
              </motion.div>
            ))}

          <motion.div
            className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-gradient shadow-xl shadow-primary/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease, delay: 0.2 }}
          >
            <BookMarked className="h-10 w-10 text-white" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

type HomeFeaturesProps = {
  features: {
    icon: typeof BookMarked;
    title: string;
    description: string;
    color: string;
  }[];
};

export function HomeFeatures({ features }: HomeFeaturesProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="mx-auto grid max-w-6xl gap-5 px-4 pb-24 sm:px-6 sm:grid-cols-3"
      variants={prefersReducedMotion ? undefined : staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-80px" }}
    >
      {features.map((feature) => (
        <motion.div
          key={feature.title}
          variants={staggerItem}
          className="group rounded-2xl border border-border/80 bg-card p-6 card-glow transition-transform duration-300 hover:-translate-y-1"
        >
          <div
            className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}
          >
            <feature.icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-medium">{feature.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

export const homeFeatures = [
  {
    icon: BookMarked,
    title: "Track every page",
    description:
      "Progress saves automatically. Mark books as reading, read, or DNF.",
    color: "bg-brand-gradient",
  },
  {
    icon: Compass,
    title: "Discover by genre",
    description:
      "Recommendations shaped by what you read and the genres you love.",
    color: "bg-[oklch(0.55_0.16_250)]",
  },
  {
    icon: Users,
    title: "Connect with readers",
    description:
      "Follow friends, share posts, and showcase your favourite books.",
    color: "bg-[oklch(0.62_0.15_35)]",
  },
];
