import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = {
  title: "Request a Book",
};

export default function RequestsPage() {
  return (
    <PlaceholderPage
      title="Request a book"
      description="Tell us what you'd like to read — admins get notified so we can source it."
      phase="Phase 6"
    />
  );
}
