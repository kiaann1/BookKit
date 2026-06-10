"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookMarked, Compass, Users } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";

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
      className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 sm:grid-cols-3"
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
