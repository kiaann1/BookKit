import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  await requireCompletedOnboarding();

  return (
    <PageShell width="medium">
      <PageHeader
        title="Settings"
        description="Profile, genres, and reading preferences."
      />
      <SettingsForm />
    </PageShell>
  );
}
