"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staggerContainer } from "@/lib/motion";

type AuthFormProps = {
  mode: "forgot-password" | "reset-password";
  token?: string;
};

export function AuthForm({ mode, token }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const titles = {
    "forgot-password": "Reset your password",
    "reset-password": "Choose a new password",
  };

  const descriptions = {
    "forgot-password": "We'll send you a link to reset your password.",
    "reset-password": "Enter a new password for your account.",
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
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
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title={titles[mode]}
      description={descriptions[mode]}
      footer={
        <Link href="/login" className="auth-shell-link hover:underline">
          Back to sign in
        </Link>
      }
    >
      <motion.form
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {mode === "forgot-password" ? (
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
        ) : (
          <AuthField id="password" label="New password">
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
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="auth-shell-copy text-sm" role="status">
            {success}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? "Please wait..."
            : mode === "forgot-password"
              ? "Send reset link"
              : "Update password"}
        </Button>
      </motion.form>
    </AuthShell>
  );
}
