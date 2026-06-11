import { existsSync } from "fs";
import path from "path";
import { getPublishedBooks } from "@/lib/books";
import { isDatabaseAvailable } from "@/lib/db/health";
import { scoreBookForUser } from "@/lib/recommendations/score";
import { matchingGenres } from "@/lib/recommendations/genre-match";

export type Phase4Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  hint?: string;
};

export type Phase4Report = {
  ok: boolean;
  checks: Phase4Check[];
};

function pushCheck(checks: Phase4Check[], check: Phase4Check) {
  checks.push(check);
}

export async function runPhase4Checks(): Promise<Phase4Report> {
  const checks: Phase4Check[] = [];
  const root = process.cwd();

  const paths = {
    engine: path.join(root, "src/lib/recommendations/index.ts"),
    settingsApi: path.join(root, "src/app/api/user/settings/route.ts"),
    recommendationsApi: path.join(root, "src/app/api/recommendations/route.ts"),
    settingsPage: path.join(root, "src/app/(app)/settings/page.tsx"),
    discoverPage: path.join(root, "src/app/(app)/recommendations/page.tsx"),
    widgets: path.join(
      root,
      "src/components/dashboard/recommendation-widgets.tsx",
    ),
  };

  for (const [id, filePath] of Object.entries(paths)) {
    pushCheck(checks, {
      id,
      label: `${path.basename(filePath)} present`,
      ok: existsSync(filePath),
      detail: filePath.replace(root + path.sep, ""),
    });
  }

  const fictionBridge = matchingGenres(["Fiction"], ["Fantasy"]);
  pushCheck(checks, {
    id: "genre_matching",
    label: "Genre matcher handles Fiction category bridge",
    ok: fictionBridge.includes("Fantasy"),
    detail: `matches: ${fictionBridge.join(", ") || "none"}`,
  });

  const books = await getPublishedBooks();
  pushCheck(checks, {
    id: "catalog_books",
    label: "Published books available for recommendations",
    ok: books.length > 0,
    detail: `${books.length} books`,
    hint: books.length === 0 ? "Upload or seed catalog books." : undefined,
  });

  if (books.length > 0) {
    const sample = books[0];
    const scored = scoreBookForUser(sample, {
      genrePreferences: ["Fantasy"],
      shelfByBookId: new Map(),
    });
    pushCheck(checks, {
      id: "scoring",
      label: "Recommendation scoring runs",
      ok: scored === null || typeof scored.reason === "string",
      detail: scored?.reason ?? "no match for sample (ok)",
    });
  }

  const dbOk = await isDatabaseAvailable();
  pushCheck(checks, {
    id: "database",
    label: "Database available for settings + prefs",
    ok: dbOk,
    hint: dbOk ? undefined : "Settings and personalized recs need DATABASE_URL.",
  });

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}
