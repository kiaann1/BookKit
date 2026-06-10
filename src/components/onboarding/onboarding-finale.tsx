"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  PublicProfileCard,
  type PublicProfilePreview,
} from "@/components/profile/public-profile-card";
import { Button } from "@/components/ui/button";
import { ease } from "@/lib/motion";

const LOADING_MESSAGES = [
  "Polishing your profile card…",
  "Stocking your virtual shelf…",
  "Finding readers like you…",
  "Almost ready…",
];

type OnboardingFinaleProps =
  | { phase: "loading" }
  | {
      phase: "reveal";
      profile: PublicProfilePreview;
      onContinue: () => void;
    };

function LoadingFinale() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 900);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-dashed border-primary/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 via-transparent to-brand-coral/30"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          {[0, 120, 240].map((angle) => (
            <div
              key={angle}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `rotate(${angle}deg) translateY(-54px)` }}
            >
              <div
                className="flex h-9 w-7 items-center justify-center rounded-sm bg-brand-gradient shadow-lg shadow-primary/30"
                style={{ transform: `rotate(-${angle}deg)` }}
              >
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-xl shadow-primary/40"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-6 w-6 text-white" />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease }}
          className="auth-shell-copy mt-8 text-sm font-medium"
        >
          {LOADING_MESSAGES[messageIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function RevealFinale({
  profile,
  onContinue,
}: {
  profile: PublicProfilePreview;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-8 py-2">
      <PublicProfileCard profile={profile} animate />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.55 }}
        className="flex justify-center"
      >
        <Button size="lg" onClick={onContinue} className="gap-2">
          Go to your dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

export function OnboardingFinale(props: OnboardingFinaleProps) {
  if (props.phase === "loading") {
    return <LoadingFinale />;
  }

  return <RevealFinale profile={props.profile} onContinue={props.onContinue} />;
}
