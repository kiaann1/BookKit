import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { FollowListForProfile } from "@/components/social/follow-list";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getUserIdByUsername } from "@/lib/social/follow";

type FollowingPageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: FollowingPageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} · Following` };
}

export const dynamic = "force-dynamic";

export default async function FollowingPage({ params }: FollowingPageProps) {
  await requireCompletedOnboarding();
  const { username } = await params;
  const userId = await getUserIdByUsername(username);

  if (!userId) {
    notFound();
  }

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Following"
        description={`People @${username} follows`}
      />

      <Link
        href={`/u/${username}`}
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to profile
      </Link>

      <FollowListForProfile username={username} type="following" />
    </FadeIn>
  );
}
