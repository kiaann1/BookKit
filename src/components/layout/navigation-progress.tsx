"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function shouldTrackNavigation(anchor: HTMLAnchorElement, pathname: string) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  if (anchor.getAttribute("data-no-progress") !== null) {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) {
    return false;
  }

  return url.pathname !== pathname || url.search !== window.location.search;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) {
        return;
      }

      const anchor = (event.target as Element).closest("a");
      if (!anchor || !shouldTrackNavigation(anchor, pathname)) {
        return;
      }

      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (prefersReducedMotion) {
    return isNavigating ? (
      <div className="fixed inset-x-0 top-0 z-[100] h-0.5 bg-primary" />
    ) : null;
  }

  return (
    <AnimatePresence>
      {isNavigating ? (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-brand-gradient shadow-[0_0_8px_rgba(139,92,246,0.45)]"
            initial={{ width: "0%" }}
            animate={{ width: "92%" }}
            transition={{ duration: 6, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
