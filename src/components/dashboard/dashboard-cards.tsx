"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Compass, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/lib/motion";

const cards = [
  {
    icon: Library,
    title: "My shelf",
    description: "Want to read, reading, read, DNF.",
    href: "/shelf",
    cta: "View shelf",
    accent: "from-brand-coral/20 to-brand-coral/5",
  },
  {
    icon: Compass,
    title: "Discover",
    description: "Recommendations picked for you.",
    href: "/recommendations",
    cta: "See picks",
    accent: "from-brand-gold/25 to-brand-gold/5",
  },
];

export function DashboardCards() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      variants={prefersReducedMotion ? undefined : staggerContainer}
      initial="initial"
      animate="animate"
    >
      {cards.map((card) => (
        <motion.div
          key={card.title}
          variants={staggerItem}
          className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 card-glow transition-transform duration-300 hover:-translate-y-1"
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`}
          />
          <div className="relative">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-md shadow-primary/20">
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {card.description}
            </p>
            <Link href={card.href} className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                {card.cta}
              </Button>
            </Link>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
