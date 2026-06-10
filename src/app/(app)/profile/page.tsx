import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <FadeIn className="mx-auto max-w-xl space-y-10">
      <PageHeader
        title="Profile"
        description="Public profile and showcase books arrive in Phase 5."
      />

      <Card>
        <CardHeader>
          <CardTitle>@{session.user.username}</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 text-sm">
          <div className="flex justify-between border-b border-border py-3">
            <span className="text-muted-foreground">Display name</span>
            <span className="font-medium">{session.user.name ?? "—"}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">Role</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {session.user.role}
            </span>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
