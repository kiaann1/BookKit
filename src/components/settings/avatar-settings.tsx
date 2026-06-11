"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareAvatarForUpload } from "@/lib/images/prepare-avatar";

type AvatarSettingsProps = {
  initialAvatarUrl: string | null;
  displayName: string;
};

export function AvatarSettings({
  initialAvatarUrl,
  displayName,
}: AvatarSettingsProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  async function uploadAvatar(file: File) {
    setError(null);
    setLoading(true);

    try {
      const prepared = await prepareAvatarForUpload(file);
      const formData = new FormData();
      formData.set("avatar", prepared);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not upload photo.");
        return;
      }

      setAvatarUrl(data.avatarUrl ?? null);
      router.refresh();
    } catch {
      setError("Could not upload photo.");
    } finally {
      setLoading(false);
    }
  }

  async function removeAvatar() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!response.ok) {
        setError("Could not remove photo.");
        return;
      }
      setAvatarUrl(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border border-border/80 bg-gradient-to-br from-primary/15 to-brand-coral/15 sm:mx-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UserRound className="h-10 w-10 text-primary/60" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Profile photo for {displayName}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? "Saving…" : "Upload photo"}
          </Button>
          {avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => void removeAvatar()}
            >
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadAvatar(file);
            }
            event.target.value = "";
          }}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
