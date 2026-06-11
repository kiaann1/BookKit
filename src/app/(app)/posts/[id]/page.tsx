import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { PostCard } from "@/components/social/post-card";
import { buttonVariants } from "@/components/ui/button";
import { requireCompletedOnboarding } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { getPostById } from "@/lib/social/posts";

type PostPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Post · ${id.slice(0, 8)}`,
  };
}

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: PostPageProps) {
  await requireCompletedOnboarding();
  const user = await getAuthenticatedUser();
  const { id } = await params;

  if (!user) {
    notFound();
  }

  const post = await getPostById(id, user.userId);

  if (!post) {
    notFound();
  }

  return (
    <FadeIn className="mx-auto min-h-full max-w-xl">
      <header className="sticky top-14 z-20 flex items-center gap-2 border-b border-border/80 bg-background/95 px-2 py-2 backdrop-blur-xl safe-top">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className={buttonVariants({
            variant: "ghost",
            size: "icon",
            className: "shrink-0",
          })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Post
        </h1>
      </header>

      <PostCard post={post} variant="timeline" mode="detail" />
    </FadeIn>
  );
}
