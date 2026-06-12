"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AvatarSettings } from "@/components/settings/avatar-settings";
import { GenrePicker } from "@/components/settings/genre-picker";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_READING_FREQUENCY,
  normalizeReadingFrequency,
  READING_FREQUENCY_OPTIONS,
  type ReadingFrequency,
} from "@/lib/constants/reading-pace";
import { cn } from "@/lib/utils";

type SettingsUser = {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  genrePreferences: string[];
  booksPerWeek: number | null;
};

export function SettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [booksPerWeek, setBooksPerWeek] = useState<ReadingFrequency>(
    DEFAULT_READING_FREQUENCY,
  );

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/user/settings");
      if (!response.ok) {
        setError("Could not load your settings.");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { user: SettingsUser };
      const loadedFirst = data.user.firstName?.trim() ?? "";
      const loadedLast = data.user.lastName?.trim() ?? "";
      setFirstName(loadedFirst);
      setLastName(loadedLast);
      setUsername(data.user.username);
      setDisplayName(
        data.user.name?.trim() ||
          [loadedFirst, loadedLast].filter(Boolean).join(" ").trim() ||
          data.user.username,
      );
      setAvatarUrl(data.user.avatarUrl ?? null);
      setBio(data.user.bio ?? "");
      setGenres(data.user.genrePreferences ?? []);
      setBooksPerWeek(normalizeReadingFrequency(data.user.booksPerWeek));
      setLoading(false);
    }

    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || !trimmedLast) {
      setError("First and last name are required.");
      setSaving(false);
      return;
    }

    if (genres.length === 0) {
      setError("Pick at least one genre.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: trimmedFirst,
          lastName: trimmedLast,
          username,
          bio: bio.trim() || null,
          genrePreferences: genres,
          booksPerWeek,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const fieldError =
          data.error?.genrePreferences?.[0] ??
          data.error?.username?.[0] ??
          data.error?.firstName?.[0] ??
          data.error?.lastName?.[0] ??
          data.error?.bio?.[0];
        setError(fieldError ?? "Could not save settings.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading your settings…</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsSection
        title="Profile photo"
        description="Shown on your profile, posts, and comments."
      >
        <AvatarSettings
          initialAvatarUrl={avatarUrl}
          displayName={displayName}
        />
      </SettingsSection>

      <SettingsSection
        title="Public profile"
        description="How other readers see you on BookKit."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(event) =>
              setUsername(
                event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
            maxLength={30}
            required
          />
          <p className="text-xs text-muted-foreground">
            Your profile: bookkit.app/u/{username || "username"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="A line or two about what you like to read."
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Reading tastes"
        description="Powers recommendations on your dashboard and Discover."
      >
        <div className="space-y-2">
          <Label>Genres you enjoy</Label>
          <GenrePicker value={genres} onChange={setGenres} disabled={saving} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Reading pace"
        description="Helps calibrate goals and future recommendations."
      >
        <div className="space-y-2">
          {READING_FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => setBooksPerWeek(option.value)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition",
                booksPerWeek === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border/80 hover:border-primary/30",
              )}
            >
              <p className="font-medium">{option.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </SettingsSection>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-primary">Profile settings saved.</p>
      ) : null}

      <Button type="submit" disabled={saving || genres.length === 0}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
