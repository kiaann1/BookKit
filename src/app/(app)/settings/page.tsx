import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  await requireCompletedOnboarding();

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-8 px-4 py-5 sm:px-6 sm:py-10">
      <PageHeader
        title="Settings"
        description="Update your profile, genre preferences, and reading pace."
      />
      <SettingsForm />
    </FadeIn>
  );
}
