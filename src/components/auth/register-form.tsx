"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staggerContainer } from "@/lib/motion";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          (typeof data.error === "string" ? data.error : null) ??
          data.error?.email?.[0] ??
          data.error?.phone?.[0] ??
          data.error?.firstName?.[0] ??
          data.error?.lastName?.[0] ??
          data.error?.password?.[0] ??
          "Could not create account.";
        setError(message);
        return;
      }

      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/onboarding",
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Join BookKit"
      description="Create your account — we'll personalize your shelf in onboarding."
      footer={
        <p>
          Have an account?{" "}
          <Link href="/login" className="auth-shell-link font-medium hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <motion.form
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="firstName" label="First name">
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              className="auth-shell-input"
            />
          </AuthField>
          <AuthField id="lastName" label="Last name">
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              className="auth-shell-input"
            />
          </AuthField>
        </div>

        <AuthField id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="auth-shell-input"
          />
        </AuthField>

        <AuthField id="phone" label="Phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="+44 7700 900000"
            className="auth-shell-input"
          />
        </AuthField>

        <AuthField id="password" label="Password" hint="At least 8 characters.">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="auth-shell-input"
          />
        </AuthField>

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </motion.p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </motion.form>
    </AuthShell>
  );
}
