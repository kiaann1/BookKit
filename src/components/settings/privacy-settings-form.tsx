"use client";

import { useEffect, useId, useState } from "react";
import { SettingRow } from "@/components/settings/setting-row";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const privateAccountId = useId();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsSection
        title="Account visibility"
        description="Choose who can see your reading activity on BookKit."
      >
        <SettingRow
          htmlFor={privateAccountId}
          label="Private account"
          description="Only approved followers can see your posts, bookshelf, and showcase."
        >
          <Switch
            id={privateAccountId}
            checked={isPrivate}
            disabled={saving}
            onCheckedChange={setIsPrivate}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Followers & following lists"
        description="Who can open your follower and following lists from your profile."
      >
        <div className="space-y-2">
          <Label>Visibility</Label>
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
      </SettingsSection>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-primary">Privacy settings saved.</p>
      ) : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
