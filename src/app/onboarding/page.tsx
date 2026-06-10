import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireOnboardingAccess } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function OnboardingPage() {
  await requireOnboardingAccess();

  return <OnboardingFlow />;
}
