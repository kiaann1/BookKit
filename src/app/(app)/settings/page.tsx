import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Account settings"
      description="Update username, password, profile picture, and genre preferences."
      phase="Phase 5"
    />
  );
}
