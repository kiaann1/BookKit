"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { staggerItem } from "@/lib/motion";

type AuthFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  delay?: number;
};

export function AuthField({ id, label, children, hint }: AuthFieldProps) {
  return (
    <motion.div variants={staggerItem} className="space-y-2">
      <Label htmlFor={id} className="auth-shell-label text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="auth-shell-hint text-xs leading-relaxed">{hint}</p>
      ) : null}
    </motion.div>
  );
}
