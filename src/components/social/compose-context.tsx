"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PostType } from "@/lib/constants/post-types";

type ComposeContextValue = {
  open: boolean;
  initialType: PostType | null;
  openCompose: (type?: PostType) => void;
  closeCompose: () => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialType, setInitialType] = useState<PostType | null>(null);

  const openCompose = useCallback((type?: PostType) => {
    setInitialType(type ?? null);
    setOpen(true);
  }, []);

  const closeCompose = useCallback(() => {
    setOpen(false);
    setInitialType(null);
  }, []);

  const value = useMemo(
    () => ({ open, initialType, openCompose, closeCompose }),
    [open, initialType, openCompose, closeCompose],
  );

  return (
    <ComposeContext.Provider value={value}>{children}</ComposeContext.Provider>
  );
}

export function useCompose() {
  const context = useContext(ComposeContext);
  if (!context) {
    throw new Error("useCompose must be used within ComposeProvider");
  }

  return context;
}
