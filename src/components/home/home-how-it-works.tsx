"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Library, Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";

const steps = [
  {
    icon: Library,
    title: "Build your shelf",
    description:
      "Save books you want to read, track what you're reading now, and celebrate finished reads.",
  },
  {
    icon: BookOpen,
    title: "Read in the browser",
    description:
      "Open any book in the catalog and pick up exactly where you left off — no downloads required.",
  },
  {
    icon: Sparkles,
    title: "Discover & share",
    description:
      "Get genre-based recommendations, follow readers, and share what you're loving with your feed.",
  },
];

export function HomeHowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need in one reading home
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            BookKit brings together a personal library, in-browser reader, and
            social layer — so you can focus on the story.
          </p>
        </div>

        <motion.ol
          className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-8"
          variants={prefersReducedMotion ? undefined : staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
        >
          {steps.map((step, index) => (
            <motion.li
              key={step.title}
              variants={staggerItem}
              className="relative rounded-2xl border border-border/80 bg-card p-6 card-glow"
            >
              <span className="font-display text-5xl font-semibold text-primary/10">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient">
                <step.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
