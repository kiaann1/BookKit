import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = {
  title: "Feed",
};

export default function FeedPage() {
  return (
    <PlaceholderPage
      title="Social feed"
      description="Posts from people you follow — reviews, thoughts, and reading updates."
      phase="Phase 5"
    />
  );
}
