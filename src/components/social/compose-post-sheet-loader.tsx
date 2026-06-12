"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCompose } from "@/components/social/compose-context";

const ComposePostSheet = dynamic(
  () =>
    import("@/components/social/compose-post-sheet").then((mod) => ({
      default: mod.ComposePostSheet,
    })),
  { ssr: false },
);

/** Loads the heavy compose sheet chunk only after the user opens it once. */
export function ComposePostSheetLoader() {
  const { open } = useCompose();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  if (!mounted) {
    return null;
  }

  return <ComposePostSheet />;
}
