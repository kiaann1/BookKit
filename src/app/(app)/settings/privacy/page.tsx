import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AccountDataRights } from "@/components/settings/account-data-rights";
import { PrivacySettingsForm } from "@/components/settings/privacy-settings-form";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Privacy settings",
};

export default async function PrivacySettingsPage() {
  await requireCompletedOnboarding();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Privacy & data"
        description="Control who sees your profile, and manage your personal data."
      />

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
    </div>
  );
}
