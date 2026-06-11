"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "bookkit-cookie-consent";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(CONSENT_KEY, "essential");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
      className="safe-bottom fixed inset-x-4 bottom-20 z-50 mx-auto max-w-lg rounded-2xl border border-border/80 bg-card p-4 shadow-lg sm:bottom-6 md:bottom-6"
    >
      <p className="text-sm text-muted-foreground">
        BookKit uses essential cookies to keep you signed in and secure your
        session. We do not use advertising or third-party tracking cookies.{" "}
        <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
