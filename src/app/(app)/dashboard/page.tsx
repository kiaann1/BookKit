import type { Metadata } from "next";
import { ContinueReadingCard } from "@/components/dashboard/continue-reading-card";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { RecommendationWidgets } from "@/components/dashboard/recommendation-widgets";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getContinueReading } from "@/lib/progress";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await requireCompletedOnboarding();
  const session = await getSession();
  const user = await getAuthenticatedUser();
  const continueReading = user
    ? await getContinueReading(user.userId)
    : null;

  return (
    <div className="page-stack flex flex-col">
      <FadeIn>
        <PageHeader
          title={
            session?.user.username
              ? `Hi, @${session.user.username}`
              : "Dashboard"
          }
          description="Pick up where you left off or explore something new."
        />
      </FadeIn>
      <ContinueReadingCard book={continueReading} />
      {user ? <RecommendationWidgets userId={user.userId} /> : null}
      <DashboardCards />
    </div>
  );
}
