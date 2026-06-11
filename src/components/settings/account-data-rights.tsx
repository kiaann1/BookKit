"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountDataRights() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    setExporting(true);

    try {
      const response = await fetch("/api/user/data-export");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setExportError(
          (data as { error?: string }).error ??
            "Could not export your data. Try again later.",
        );
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "bookkit-data-export.json";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Could not export your data. Try again later.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDeleting(true);

    try {
      const response = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm: confirmDelete }),
      });

      const data = await response.json();

      if (!response.ok) {
        const fieldError = data.error?.password?.[0] ?? data.error?.confirm?.[0];
        setError(fieldError ?? data.error ?? "Could not delete your account.");
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Could not delete your account. Try again later.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
        <div>
          <h2 className="font-medium">Download your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get a JSON copy of your profile, shelf, posts, and comments. You can
            request this up to three times per hour.
          </p>
        </div>

        {exportError ? (
          <p className="text-sm text-destructive" role="alert">
            {exportError}
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          disabled={exporting}
          onClick={() => void handleExport()}
        >
          {exporting ? "Preparing export…" : "Download my data"}
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-5 sm:p-6">
        <div>
          <h2 className="font-medium text-destructive">Delete account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently remove your account, posts, shelf, and social data. This
            cannot be undone. PDFs you uploaded as an admin are not deleted
            here.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-password">Current password</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={deleting}
              required
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 p-4">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(event) => setConfirmDelete(event.target.checked)}
              disabled={deleting}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span className="text-sm">
              I understand this permanently deletes my account and data.
            </span>
          </label>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="destructive" disabled={deleting}>
            {deleting ? "Deleting…" : "Delete my account"}
          </Button>
        </form>
      </section>
    </div>
  );
}
