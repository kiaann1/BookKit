import { cache } from "react";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { devSession, isAuthDisabled } from "@/lib/dev-auth";

export const getSession = cache(async (): Promise<Session | null> => {
  if (isAuthDisabled()) {
    return devSession;
  }
  return auth();
});
