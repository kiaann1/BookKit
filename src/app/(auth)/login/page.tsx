import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <Suspense
      fallback={
        <div className="auth-shell-copy text-sm">Loading...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
