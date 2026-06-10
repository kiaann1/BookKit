import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = {
  title: "Discover",
};

export default function RecommendationsPage() {
  return (
    <PlaceholderPage
      title="Recommendations"
      description="Books picked for you based on your genres and reading history."
      phase="Phase 4"
    />
  );
}
