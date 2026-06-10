"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CircleAlert, Loader2, RefreshCw } from "lucide-react";

type Phase1Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  hint?: string;
};

type Phase1Report = {
  ok: boolean;
  checks: Phase1Check[];
  publishedBookCount: number;
  storageDriver: string;
};

export function Phase1Status() {
  const [report, setReport] = useState<Phase1Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/health/phase1", { cache: "no-store" });
      const data = (await response.json()) as Phase1Report & { error?: string };
      if (!data.checks?.length && data.error) {
        throw new Error(data.error);
      }
      setReport(data);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load Phase 1 status.",
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 card-glow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">Phase 1 — Catalog readiness</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Database, storage, and published books required for the catalog exit
            criteria.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !report ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking…</p>
      ) : null}

      {report ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {report.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className="font-medium">
              {report.ok ? "Phase 1 complete" : "Phase 1 needs attention"}
            </span>
            <span className="text-muted-foreground">
              · {report.publishedBookCount} published · {report.storageDriver}{" "}
              storage
            </span>
          </div>

          <ul className="space-y-2">
            {report.checks.map((check) => (
              <li
                key={check.id}
                className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="flex items-start gap-2">
                  {check.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="min-w-0">
                    <p>{check.label}</p>
                    {check.detail ? (
                      <p className="text-muted-foreground">{check.detail}</p>
                    ) : null}
                    {!check.ok && check.hint ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {check.hint}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
