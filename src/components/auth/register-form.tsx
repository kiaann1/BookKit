"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ease, staggerContainer } from "@/lib/motion";

type NameInsights = {
  count: number;
  isTaken: boolean;
  displayNameSuggestions: string[];
  suggestedGenres: string[];
  bookRecommendations: Array<{
    title: string;
    author: string;
    genre: string;
    reason: string;
  }>;
};

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameInsights, setNameInsights] = useState<NameInsights | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setNameInsights(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setCheckingName(true);
      try {
        const params = new URLSearchParams({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        const response = await fetch(`/api/auth/check-name?${params.toString()}`);
        if (response.ok) {
          setNameInsights(await response.json());
        }
      } finally {
        setCheckingName(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [firstName, lastName]);

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
          data.error?.email?.[0] ??
          data.error?.phone?.[0] ??
          data.error?.firstName?.[0] ??
          data.error?.lastName?.[0] ??
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

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Join BookKit"
      description="Create your account and we’ll tailor your shelf in a quick onboarding."
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
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="auth-shell-input"
            />
          </AuthField>
          <AuthField id="lastName" label="Last name">
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="auth-shell-input"
            />
          </AuthField>
        </div>

        <AnimatePresence>
          {(nameInsights || checkingName) && firstName.trim() && lastName.trim() ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-4"
            >
              {checkingName ? (
                <p className="auth-shell-hint text-sm">Checking your name in the library...</p>
              ) : nameInsights ? (
                <div className="space-y-3">
                  {nameInsights.isTaken ? (
                    <p className="auth-shell-copy text-sm">
                      {nameInsights.count} other reader
                      {nameInsights.count === 1 ? "" : "s"} share your name — we’ll help you stand out in onboarding.
                    </p>
                  ) : (
                    <p className="auth-shell-copy text-sm">
                      Your name looks unique here. Nice.
                    </p>
                  )}
                  {nameInsights.bookRecommendations.length > 0 ? (
                    <div>
                      <p className="auth-shell-label mb-2 text-xs font-semibold uppercase tracking-wide">
                        Based on your name
                      </p>
                      <div className="space-y-2">
                        {nameInsights.bookRecommendations.slice(0, 2).map((book) => (
                          <div
                            key={`${book.title}-${book.author}`}
                            className="rounded-xl bg-background/30 px-3 py-2"
                          >
                            <p className="auth-shell-copy text-sm font-medium">
                              {book.title}
                            </p>
                            <p className="auth-shell-hint text-xs">
                              {book.author} · {book.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </motion.form>
    </AuthShell>
  );
}
