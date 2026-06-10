import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function redirectIfAuthenticated() {
  const session = await getSession();
  if (!session?.user) {
    return;
  }

  redirect(
    session.user.onboardingCompleted ? "/dashboard" : "/onboarding",
  );
}

export async function requireOnboardingAccess() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.onboardingCompleted) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireCompletedOnboarding() {
  const session = await getSession();
  if (session?.user && !session.user.onboardingCompleted) {
    redirect("/onboarding");
  }
}
