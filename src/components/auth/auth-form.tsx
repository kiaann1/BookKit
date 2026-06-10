"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";

type AuthFormProps = {
  mode: "login" | "register" | "forgot-password" | "reset-password";
  token?: string;
};

export function AuthForm({ mode, token }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      if (mode === "login") {
        const result = await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password.");
          return;
        }

        router.push(callbackUrl);
        router.refresh();
        return;
      }

      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.get("email"),
            username: formData.get("username"),
            password: formData.get("password"),
            name: formData.get("name") || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const message =
            data.error?.email?.[0] ??
            data.error?.username?.[0] ??
            data.error?.password?.[0] ??
            "Could not create account.";
          setError(message);
          return;
        }

        const signInResult = await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirect: false,
        });

        if (signInResult?.error) {
          router.push("/login");
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (mode === "forgot-password") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.get("email") }),
        });

        if (!response.ok) {
          setError("Could not process request. Try again.");
          return;
        }

        setSuccess(
          "If an account exists for that email, you'll receive reset instructions shortly.",
        );
        return;
      }

      if (mode === "reset-password") {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password: formData.get("password"),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Could not reset password.");
          return;
        }

        setSuccess("Password updated. You can sign in now.");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const titles = {
    login: "Welcome back",
    register: "Create your account",
    "forgot-password": "Reset your password",
    "reset-password": "Choose a new password",
  };

  const descriptions = {
    login: "Sign in to continue reading and connecting.",
    register: "Join BookKit and start building your bookshelf.",
    "forgot-password": "We'll send you a link to reset your password.",
    "reset-password": "Enter a new password for your account.",
  };

  return (
    <FadeIn className="w-full max-w-md">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {titles[mode]}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {descriptions[mode]}
        </p>
      </div>
      <Card className="border-border/80 bg-card/80 p-6 backdrop-blur-sm">
      <CardContent className="p-0 pt-2">
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display name (optional)</Label>
                <Input id="name" name="name" autoComplete="name" maxLength={80} />
              </div>
            </>
          )}

          {mode !== "reset-password" && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
          )}

          {(mode === "login" ||
            mode === "register" ||
            mode === "reset-password") && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={8}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-[13px] text-foreground" role="status">
              {success}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : mode === "forgot-password"
                    ? "Send reset link"
                    : "Update password"}
          </Button>
        </form>

        <div className="mt-8 space-y-2 text-center text-[13px] text-muted-foreground">
          {mode === "login" && (
            <>
              <p>
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Forgot password
                </Link>
              </p>
              <p>
                New here?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Create account
                </Link>
              </p>
            </>
          )}
          {mode === "register" && (
            <p>
              Have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          )}
          {(mode === "forgot-password" || mode === "reset-password") && (
            <p>
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
    </FadeIn>
  );
}
