import { existsSync } from "fs";
import path from "path";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";

export type Phase6Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  hint?: string;
};

export type Phase6Report = {
  ok: boolean;
  checks: Phase6Check[];
};

function pushCheck(checks: Phase6Check[], check: Phase6Check) {
  checks.push(check);
}

export async function runPhase6Checks(): Promise<Phase6Report> {
  const checks: Phase6Check[] = [];
  const root = process.cwd();

  const paths = {
    bookRequestsLib: path.join(root, "src/lib/book-requests/index.ts"),
    bookRequestsApi: path.join(root, "src/app/api/book-requests/route.ts"),
    adminBookRequestsApi: path.join(
      root,
      "src/app/api/admin/book-requests/route.ts",
    ),
    requestsPage: path.join(root, "src/app/(app)/requests/page.tsx"),
    adminRequestsPage: path.join(root, "src/app/admin/requests/page.tsx"),
    requestForm: path.join(
      root,
      "src/components/book-requests/book-request-form.tsx",
    ),
    migration: path.join(
      root,
      "prisma/migrations/20250610220000_book_requests/migration.sql",
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

  const dbOk = await isDatabaseAvailable();
  pushCheck(checks, {
    id: "database",
    label: "Database available for book requests",
    ok: dbOk,
    hint: dbOk ? undefined : "Book requests need DATABASE_URL.",
  });

  if (dbOk) {
    try {
      const tables = await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('BookRequest', 'BookRequestVote')
      `;
      const found = new Set(tables.map((row) => row.table_name));
      const required = ["BookRequest", "BookRequestVote"];
      const missing = required.filter((name) => !found.has(name));

      pushCheck(checks, {
        id: "tables",
        label: "BookRequest tables exist",
        ok: missing.length === 0,
        detail: missing.length ? `Missing: ${missing.join(", ")}` : undefined,
        hint:
          missing.length > 0
            ? "Run prisma migrate deploy or scripts/apply-pending-migrations-neon.sql section 6."
            : undefined,
      });
    } catch (error) {
      pushCheck(checks, {
        id: "tables",
        label: "BookRequest tables exist",
        ok: false,
        detail: error instanceof Error ? error.message : "Query failed",
      });
    }
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}
