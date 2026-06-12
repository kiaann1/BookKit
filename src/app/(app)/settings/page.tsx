import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  await requireCompletedOnboarding();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Update your photo, name, bio, and reading preferences."
      />
      <SettingsForm />
    </>
  );
}
