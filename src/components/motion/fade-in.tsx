"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ease, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article";
};

export function FadeIn({
  children,
  className,
  delay = 0,
  as = "div",
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as];

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Component
      className={cn(className)}
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={{ duration: 0.22, ease, delay }}
    >
      {children}
    </Component>
  );
}
