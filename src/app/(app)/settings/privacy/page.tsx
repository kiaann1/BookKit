import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { AccountDataRights } from "@/components/settings/account-data-rights";
import { PrivacySettingsForm } from "@/components/settings/privacy-settings-form";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Privacy settings",
};

export default async function PrivacySettingsPage() {
  await requireCompletedOnboarding();

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-8 px-4 py-5 sm:px-6 sm:py-10">
      <PageHeader
        title="Privacy"
        description="Control who can see your profile details and social lists."
      />

      <p className="text-sm text-muted-foreground">
        <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
          Back to settings
        </Link>
      </p>

      <PrivacySettingsForm />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Export or delete your personal data (GDPR data subject rights).
          </p>
        </div>
        <AccountDataRights />
      </div>
    </FadeIn>
  );
}
