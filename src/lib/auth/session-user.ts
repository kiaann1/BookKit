import { redirect } from "next/navigation";
import { resolveUserId } from "@/lib/dev-auth";
import { getSession } from "@/lib/session";

export async function getAuthenticatedUser() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const userId = await resolveUserId(session.user.id);
  return { session, userId };
}

export async function requireUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
