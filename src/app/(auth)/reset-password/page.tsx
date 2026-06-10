import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Reset password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        Missing reset token. Request a new link from the forgot password page.
      </p>
    );
  }

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
      <AuthForm mode="reset-password" token={token} />
    </Suspense>
  );
}
