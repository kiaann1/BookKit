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

export type ComposeBookTag = {
  id: string;
  title: string;
  author: string;
};

type ComposeOptions = {
  type?: PostType;
  book?: ComposeBookTag;
  body?: string;
};

type ComposeContextValue = {
  open: boolean;
  initialType: PostType | null;
  initialBook: ComposeBookTag | null;
  initialBody: string | null;
  openCompose: (options?: PostType | ComposeOptions) => void;
  closeCompose: () => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialType, setInitialType] = useState<PostType | null>(null);
  const [initialBook, setInitialBook] = useState<ComposeBookTag | null>(null);
  const [initialBody, setInitialBody] = useState<string | null>(null);

  const openCompose = useCallback((options?: PostType | ComposeOptions) => {
    if (typeof options === "string") {
      setInitialType(options);
      setInitialBook(null);
      setInitialBody(null);
    } else {
      setInitialType(options?.type ?? null);
      setInitialBook(options?.book ?? null);
      setInitialBody(options?.body ?? null);
    }
    setOpen(true);
  }, []);

  const closeCompose = useCallback(() => {
    setOpen(false);
    setInitialType(null);
    setInitialBook(null);
    setInitialBody(null);
  }, []);

  const value = useMemo(
    () => ({
      open,
      initialType,
      initialBook,
      initialBody,
      openCompose,
      closeCompose,
    }),
    [open, initialType, initialBook, initialBody, openCompose, closeCompose],
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
