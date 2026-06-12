"use client";

import { useEffect, useState } from "react";

export function useMobileChatViewport(enabled = true) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 767px)");
    const visualViewport = window.visualViewport;

    function update() {
      if (!media.matches) {
        setHeight(null);
        return;
      }

      if (visualViewport) {
        setHeight(visualViewport.height);
        return;
      }

      setHeight(window.innerHeight);
    }

    update();
    visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    media.addEventListener("change", update);

    return () => {
      visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, [enabled]);

  return height;
}
