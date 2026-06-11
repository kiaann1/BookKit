"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FOLLOW_LIST_VISIBILITY_OPTIONS,
  type FollowListVisibility,
} from "@/lib/constants/privacy";
import { cn } from "@/lib/utils";

type PrivacySettings = {
  isPrivate: boolean;
  followersListVisibility: FollowListVisibility;
};

export function PrivacySettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [followersListVisibility, setFollowersListVisibility] =
    useState<FollowListVisibility>("PUBLIC");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/user/privacy");
      if (!response.ok) {
        setError("Could not load privacy settings.");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { privacy: PrivacySettings };
      setIsPrivate(data.privacy.isPrivate);
      setFollowersListVisibility(data.privacy.followersListVisibility);
      setLoading(false);
    }

    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch("/api/user/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPrivate,
          followersListVisibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error?.followersListVisibility?.[0] ??
            "Could not save privacy settings.",
        );
        return;
      }

      setSuccess(true);
    } catch {
      setError("Could not save privacy settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading privacy settings…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
        <div>
          <h2 className="font-medium">Private account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When your account is private, only followers can see your posts,
            bookshelf, and showcase.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 p-4">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border"
          />
          <span>
            <span className="font-medium">Private account</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              People must follow you to see your reading activity.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
        <div>
          <h2 className="font-medium">Followers &amp; following lists</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Control who can open your followers and following lists from your
            profile.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Who can see these lists</Label>
          {FOLLOW_LIST_VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => setFollowersListVisibility(option.value)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition",
                followersListVisibility === option.value
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
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-primary">Privacy settings saved.</p>
      ) : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save privacy settings"}
      </Button>
    </form>
  );
}
