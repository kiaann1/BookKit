"use client";

import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, BookOpen, Sparkles, Trash2, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingFinale } from "@/components/onboarding/onboarding-finale";
import type { PublicProfilePreview } from "@/components/profile/public-profile-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ONBOARDING_GENRE_GROUPS } from "@/lib/constants/genres";
import {
  DEFAULT_READING_FREQUENCY,
  getReadingFrequencyLabel,
  normalizeReadingFrequency,
  READING_FREQUENCY_OPTIONS,
} from "@/lib/constants/reading-pace";
import { ease } from "@/lib/motion";
import { USERNAME_PATTERN } from "@/lib/user/username";
import { cn } from "@/lib/utils";

type NameInsights = {
  count: number;
  isTaken: boolean;
  usernameSuggestions: string[];
  suggestedGenres: string[];
};

const STEPS = ["welcome", "name", "genres", "pace", "profile"] as const;
type Step = (typeof STEPS)[number];

const stepMeta: Record<
  Step,
  { title: string; description: string; icon: typeof Sparkles }
> = {
  welcome: {
    title: "Welcome aboard",
    description: "Let's shape your reading world in under a minute.",
    icon: Sparkles,
  },
  name: {
    title: "Choose your username",
    description: "This is how readers will find and mention you on BookKit.",
    icon: AtSign,
  },
  genres: {
    title: "What do you reach for?",
    description: "Pick the genres that feel most like you.",
    icon: BookOpen,
  },
  pace: {
    title: "How often do you read?",
    description: "No wrong answers — this helps us calibrate recommendations and goals.",
    icon: BookOpen,
  },
  profile: {
    title: "Finish your profile",
    description: "Add a short bio if you like — a profile photo is completely optional.",
    icon: UserRound,
  },
};

function normalizeUsernameInput(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

export function OnboardingFlow() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [nameInsights, setNameInsights] = useState<NameInsights | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [booksPerWeek, setBooksPerWeek] = useState(DEFAULT_READING_FREQUENCY);
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [finalePhase, setFinalePhase] = useState<"loading" | "reveal" | null>(
    null,
  );
  const [savedProfile, setSavedProfile] = useState<PublicProfilePreview | null>(
    null,
  );

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const Icon = stepMeta[step].icon;
  const usernameIsValid = USERNAME_PATTERN.test(username);

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
      setUsername(data.user.username ?? session?.user?.username ?? "");
      setGenres(data.user.genrePreferences ?? []);
      setBooksPerWeek(normalizeReadingFrequency(data.user.booksPerWeek));
      setBio(data.user.bio ?? "");
      setAvatarPreview(data.user.avatarUrl ?? null);
      setLoading(false);
    }

    void loadProfile();
  }, [session?.user?.username]);

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
        setUsernameSuggestions(data.usernameSuggestions);
        setUsername((current) =>
          current.trim() ? current : (data.usernameSuggestions[0] ?? current),
        );
        setGenres((current) =>
          current.length > 0 ? current : data.suggestedGenres.slice(0, 3),
        );
      });
  }, [firstName, lastName]);

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

  function removeAvatar() {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
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
    setFinalePhase("loading");

    const minFinaleDelay = new Promise((resolve) => {
      window.setTimeout(resolve, 2400);
    });

    try {
      let avatarUrl: string | null = null;

      if (avatarRemoved) {
        const deleteResponse = await fetch("/api/user/avatar", {
          method: "DELETE",
        });
        const deleteData = (await deleteResponse.json()) as { error?: string };
        if (!deleteResponse.ok) {
          throw new Error(deleteData.error ?? "Could not remove photo");
        }
        avatarUrl = null;
      } else if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const uploadResponse = await fetch("/api/user/avatar", {
          method: "POST",
          body: formData,
        });
        const uploadData = (await uploadResponse.json()) as {
          avatarUrl?: string;
          error?: string;
        };
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error ?? "Could not upload avatar");
        }
        avatarUrl = uploadData.avatarUrl ?? null;
      } else if (avatarPreview?.startsWith("/api/")) {
        avatarUrl = avatarPreview;
      }

      const [response] = await Promise.all([
        fetch("/api/user/onboarding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            username,
            displayName: `${firstName} ${lastName}`.trim(),
            genrePreferences: genres,
            booksPerWeek,
            bio,
            avatarUrl,
            complete: true,
          }),
        }),
        minFinaleDelay,
      ]);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error?.username?.[0] ??
            data.error?.genrePreferences?.[0] ??
            "Could not save onboarding.",
        );
      }

      const data = await response.json();
      await update({
        onboardingCompleted: true,
        username: data.user.username,
      });

      const displayName = `${firstName} ${lastName}`.trim() || username;

      setSavedProfile({
        username: data.user.username ?? username,
        displayName,
        bio: bio.trim() || null,
        avatarUrl,
        genres,
        readingPaceLabel: getReadingFrequencyLabel(booksPerWeek),
      });
      setFinalePhase("reveal");
    } catch (caught) {
      setFinalePhase(null);
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

  if (finalePhase) {
    return (
      <AuthShell
        title={
          finalePhase === "loading"
            ? "Almost there"
            : "Here's your reader card"
        }
        description={
          finalePhase === "loading"
            ? "We're setting up your shelf and polishing your profile."
            : "This is what other readers see when they visit your profile."
        }
        className="max-w-2xl"
      >
        {finalePhase === "loading" ? (
          <OnboardingFinale phase="loading" />
        ) : (
          savedProfile && (
            <OnboardingFinale
              phase="reveal"
              profile={savedProfile}
              onContinue={() => {
                window.location.assign("/dashboard");
              }}
            />
          )
        )}
      </AuthShell>
    );
  }

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
                    {nameInsights.count === 1 ? "" : "s"} share your name — a
                    unique username helps friends find the right you.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="auth-shell-label text-sm font-medium"
                >
                  Username
                </label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) =>
                      setUsername(normalizeUsernameInput(event.target.value))
                    }
                    placeholder="your_username"
                    autoComplete="username"
                    className="auth-shell-input pl-10"
                  />
                </div>
                <p className="auth-shell-hint text-xs">
                  Lowercase letters, numbers, and underscores only.
                </p>
              </div>

              {usernameSuggestions.length > 0 ? (
                <div className="space-y-2">
                  <p className="auth-shell-label text-sm font-medium">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {usernameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setUsername(suggestion)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 font-mono text-sm transition",
                          username === suggestion
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/15 bg-white/5 auth-shell-copy hover:border-primary/40",
                        )}
                      >
                        @{suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "genres" ? (
            <div className="space-y-6">
              <p className="auth-shell-hint text-xs">
                Choose up to 8 — tap to toggle.
              </p>
              {ONBOARDING_GENRE_GROUPS.map((group) => (
                <div key={group.label} className="space-y-3">
                  <h3 className="auth-shell-copy text-sm font-semibold tracking-wide">
                    {group.label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.genres.map((genre) => {
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
                </div>
              ))}
            </div>
          ) : null}

          {step === "pace" ? (
            <div className="space-y-3">
              <p className="auth-shell-copy text-sm">
                How frequently do you actually pick up a book?
              </p>
              <div className="grid gap-3">
                {READING_FREQUENCY_OPTIONS.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    whileHover={{ y: -2 }}
                    onClick={() => setBooksPerWeek(option.value)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      booksPerWeek === option.value
                        ? "border-primary bg-primary/15 shadow-lg shadow-primary/10"
                        : "border-white/10 bg-white/5 hover:border-primary/30",
                    )}
                  >
                    <p className="auth-shell-copy font-medium">{option.label}</p>
                    <p className="auth-shell-copy mt-1 text-sm leading-relaxed">
                      {option.description}
                    </p>
                    <p className="auth-shell-hint mt-2 text-xs italic">
                      {option.detail}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "profile" ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <label className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-white/20 bg-white/5 transition hover:border-primary/40">
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
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                    {avatarPreview ? "Change" : "Add photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      if (avatarPreview?.startsWith("blob:")) {
                        URL.revokeObjectURL(avatarPreview);
                      }
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                      setAvatarRemoved(false);
                      event.target.value = "";
                    }}
                  />
                </label>
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <p className="auth-shell-copy text-sm font-medium">
                      Profile photo{" "}
                      <span className="auth-shell-hint font-normal">(optional)</span>
                    </p>
                    <p className="auth-shell-hint mt-1 text-xs">
                      Skip this if you prefer — you can always add one later.
                      JPG, PNG, or WebP under 2MB.
                    </p>
                  </div>
                  {avatarPreview ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={removeAvatar}
                      className="gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove photo
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="auth-shell-label text-sm font-medium">
                  Bio{" "}
                  <span className="auth-shell-hint font-normal">(optional)</span>
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
                disabled={submitting || genres.length === 0 || !usernameIsValid}
                className="sm:min-w-40"
              >
                {submitting ? "Finishing..." : "Enter BookKit"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  (step === "name" && !usernameIsValid) ||
                  (step === "genres" && genres.length === 0)
                }
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
