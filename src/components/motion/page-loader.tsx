"use client";

import { motion, useReducedMotion } from "framer-motion";

export function PageLoader() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 rounded-xl bg-brand-gradient" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6">
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg shadow-primary/25"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-40 blur-md"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative text-sm font-bold text-white">B</span>
      </motion.div>

      <div className="h-1 w-36 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full w-1/3 rounded-full bg-brand-gradient"
          animate={{ x: ["-100%", "320%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
