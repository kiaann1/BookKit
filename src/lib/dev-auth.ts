import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";

/** Skip login in local dev — never honored in production. */
export function isAuthDisabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DISABLE_AUTH === "true"
  );
}

export const devSession: Session = {
  user: {
    id: "dev-user",
    email: "dev@bookkit.local",
    name: "Dev User",
    image: null,
    username: "devuser",
    role: UserRole.ADMIN,
    onboardingCompleted: true,
  },
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
};

/** Stable user id for shelf/auth — uses local id when DB is skipped. */
export async function resolveUserId(sessionUserId: string) {
  if (isAuthDisabled() && sessionUserId === devSession.user.id) {
    if (!(await isDatabaseAvailable())) {
      return devSession.user.id;
    }
    return resolveUploaderId(sessionUserId);
  }
  return sessionUserId;
}

/** Ensures the mock dev user exists in the DB for FK relations. */
export async function resolveUploaderId(sessionUserId: string) {
  if (isAuthDisabled() && sessionUserId === devSession.user.id) {
    if (!(await isDatabaseAvailable())) {
      return devSession.user.id;
    }

    const user = await prisma.user.upsert({
      where: { email: devSession.user.email! },
      create: {
        email: devSession.user.email!,
        username: devSession.user.username,
        name: devSession.user.name,
        role: UserRole.ADMIN,
      },
      update: { role: UserRole.ADMIN },
    });
    return user.id;
  }
  return sessionUserId;
}
