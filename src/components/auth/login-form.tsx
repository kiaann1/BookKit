"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staggerContainer } from "@/lib/motion";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      window.location.assign(callbackUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to pick up your reading life where you left off."
      footer={
        <p>
          New here?{" "}
          <Link href="/register" className="auth-shell-link font-medium hover:underline">
            Create an account
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

        <AuthField id="password" label="Password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="auth-shell-input"
          />
        </AuthField>

        <p className="text-right text-sm">
          <Link href="/forgot-password" className="auth-shell-link hover:underline">
            Forgot password?
          </Link>
        </p>

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

        <motion.div variants={staggerContainer}>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}
