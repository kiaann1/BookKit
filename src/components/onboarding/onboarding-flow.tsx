"use client";

import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Sparkles, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { BOOKS_PER_WEEK_OPTIONS } from "@/lib/constants/reading-pace";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

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

const STEPS = ["welcome", "name", "genres", "pace", "profile"] as const;
type Step = (typeof STEPS)[number];

const stepMeta: Record<
  Step,
  { title: string; description: string; icon: typeof Sparkles }
> = {
  welcome: {
    title: "Welcome aboard",
    description: "Let’s shape your reading world in under a minute.",
    icon: Sparkles,
  },
  name: {
    title: "Make it yours",
    description: "We’ll help you stand out if your name’s already on the shelf.",
    icon: UserRound,
  },
  genres: {
    title: "What do you reach for?",
    description: "Pick the genres that feel most like you.",
    icon: BookOpen,
  },
  pace: {
    title: "Your reading rhythm",
    description: "We use this to pace recommendations and goals.",
    icon: BookOpen,
  },
  profile: {
    title: "Finish your profile",
    description: "Add a face and a line about what you love to read.",
    icon: UserRound,
  },
};

export function OnboardingFlow() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameInsights, setNameInsights] = useState<NameInsights | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [booksPerWeek, setBooksPerWeek] = useState(2);
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const Icon = stepMeta[step].icon;

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/user/onboarding");
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      setFirstName(data.user.firstName ?? "");
      setLastName(data.user.lastName ?? "");
      setDisplayName(data.user.name ?? "");
      setGenres(data.user.genrePreferences ?? []);
      setBooksPerWeek(data.user.booksPerWeek ?? 2);
      setBio(data.user.bio ?? "");
      setAvatarPreview(data.user.avatarUrl ?? null);
      setLoading(false);
    }

    void loadProfile();
  }, []);

  useEffect(() => {
    if (!firstName.trim() || !lastName.trim()) {
      return;
    }

    const params = new URLSearchParams({ firstName, lastName });
    void fetch(`/api/auth/check-name?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: NameInsights | null) => {
        if (!data) {
          return;
        }
        setNameInsights(data);
        setDisplayName((current) =>
          current.trim()
            ? current
            : (data.displayNameSuggestions[0] ?? `${firstName} ${lastName}`),
        );
        setGenres((current) =>
          current.length > 0 ? current : data.suggestedGenres.slice(0, 3),
        );
      });
  }, [firstName, lastName]);

  const recommendations = useMemo(
    () => nameInsights?.bookRecommendations ?? [],
    [nameInsights],
  );

  function nextStep() {
    const next = STEPS[stepIndex + 1];
    if (next) {
      setStep(next);
    }
  }

  function prevStep() {
    const prev = STEPS[stepIndex - 1];
    if (prev) {
      setStep(prev);
    }
  }

  function toggleGenre(genre: string) {
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((value) => value !== genre)
        : current.length < 8
          ? [...current, genre]
          : current,
    );
  }

  async function finishOnboarding() {
    setSubmitting(true);
    setError(null);

    try {
      let avatarUrl = avatarPreview;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const uploadResponse = await fetch("/api/user/avatar", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error("Could not upload avatar");
        }
        const uploadData = await uploadResponse.json();
        avatarUrl = uploadData.avatarUrl;
      }

      const response = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName,
          genrePreferences: genres,
          booksPerWeek,
          bio,
          avatarUrl,
          complete: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.genrePreferences?.[0] ?? "Could not save onboarding.",
        );
      }

      await update({ onboardingCompleted: true });
      window.location.assign("/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthShell
        title="Setting things up"
        description="Just a moment while we get your shelf ready."
      >
        <div className="auth-shell-copy py-10 text-center text-sm">Loading...</div>
      </AuthShell>
    );
  }

  const greetingName =
    firstName.trim() || session?.user?.name?.split(" ")[0] || "reader";

  return (
    <AuthShell
      title={stepMeta[step].title}
      description={stepMeta[step].description}
      className="max-w-2xl"
    >
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/70">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-brand-coral to-brand-gold"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="auth-shell-copy text-sm">
              {step === "welcome"
                ? `Hey ${greetingName}, your reading journey starts here.`
                : stepMeta[step].description}
            </p>
          </div>

          {step === "name" ? (
            <div className="space-y-4">
              {nameInsights?.isTaken ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="auth-shell-copy text-sm">
                    {nameInsights.count} other reader
                    {nameInsights.count === 1 ? "" : "s"} already use{" "}
                    <strong>
                      {firstName} {lastName}
                    </strong>
                    . Pick how you’d like to appear:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nameInsights.displayNameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setDisplayName(suggestion)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition",
                          displayName === suggestion
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/15 bg-white/5 auth-shell-copy hover:border-primary/40",
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="auth-shell-copy text-sm">
                  You’ll appear as <strong>{displayName || `${firstName} ${lastName}`}</strong>.
                </p>
              )}

              {recommendations.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendations.map((book) => (
                    <motion.div
                      key={`${book.title}-${book.author}`}
                      whileHover={{ y: -3 }}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="auth-shell-copy text-sm font-medium">
                        {book.title}
                      </p>
                      <p className="auth-shell-hint mt-1 text-xs">
                        {book.author}
                      </p>
                      <p className="auth-shell-hint mt-2 text-xs leading-relaxed">
                        {book.reason}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "genres" ? (
            <div className="flex flex-wrap gap-2">
              {BOOK_GENRES.map((genre) => {
                const selected = genres.includes(genre);
                return (
                  <motion.button
                    key={genre}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleGenre(genre)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition",
                      selected
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-white/15 bg-white/5 auth-shell-copy hover:border-primary/40",
                    )}
                  >
                    {genre}
                  </motion.button>
                );
              })}
            </div>
          ) : null}

          {step === "pace" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {BOOKS_PER_WEEK_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  whileHover={{ y: -2 }}
                  onClick={() => setBooksPerWeek(option.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    booksPerWeek === option.value
                      ? "border-primary bg-primary/15"
                      : "border-white/10 bg-white/5 hover:border-primary/30",
                  )}
                >
                  <p className="auth-shell-copy font-medium">{option.label}</p>
                  <p className="auth-shell-hint text-xs">{option.hint}</p>
                </motion.button>
              ))}
            </div>
          ) : null}

          {step === "profile" ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-white/20 bg-white/5">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Avatar preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <UserRound className="h-10 w-10 text-white/50" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
                <div className="flex-1 space-y-2">
                  <p className="auth-shell-copy text-sm font-medium">
                    Profile photo
                  </p>
                  <p className="auth-shell-hint text-xs">
                    Optional. JPG, PNG, or WebP under 2MB.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="auth-shell-label text-sm font-medium">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="What kinds of stories pull you in?"
                  className="auth-shell-input min-h-28 resize-none"
                  maxLength={500}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={stepIndex === 0 || submitting}
              className="sm:min-w-28"
            >
              Back
            </Button>

            {step === "profile" ? (
              <Button
                type="button"
                onClick={() => void finishOnboarding()}
                disabled={submitting || genres.length === 0}
                className="sm:min-w-40"
              >
                {submitting ? "Finishing..." : "Enter BookKit"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={step === "genres" && genres.length === 0}
                className="sm:min-w-32"
              >
                Continue
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
}
