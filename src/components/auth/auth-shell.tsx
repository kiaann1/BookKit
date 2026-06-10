"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ease, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className={cn("auth-shell relative w-full max-w-md", className)}>
      <div className="auth-shell-orb auth-shell-orb-a" aria-hidden />
      <div className="auth-shell-orb auth-shell-orb-b" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="relative z-10"
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mb-8 text-center sm:text-left"
        >
          <motion.p
            variants={staggerItem}
            className="auth-shell-kicker mb-2 text-xs font-semibold uppercase tracking-[0.22em]"
          >
            BookKit
          </motion.p>
          <motion.h1
            variants={staggerItem}
            className="auth-shell-title font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {title}
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="auth-shell-description mt-3 text-sm leading-relaxed sm:text-[15px]"
          >
            {description}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease, delay: 0.08 }}
          className="auth-shell-card rounded-3xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          {children}
        </motion.div>

        {footer ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="auth-shell-footer mt-8 text-center text-sm"
          >
            {footer}
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
}
