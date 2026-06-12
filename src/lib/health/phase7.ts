import { existsSync } from "fs";
import path from "path";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";

export type Phase7Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  hint?: string;
};

export type Phase7Report = {
  ok: boolean;
  checks: Phase7Check[];
};

export async function runPhase7Checks(): Promise<Phase7Report> {
  const checks: Phase7Check[] = [];
  const root = process.cwd();

  const paths = {
    notificationsLib: path.join(root, "src/lib/notifications/index.ts"),
    messagesLib: path.join(root, "src/lib/messages/index.ts"),
    notificationsApi: path.join(root, "src/app/api/notifications/route.ts"),
    messagesApi: path.join(root, "src/app/api/messages/route.ts"),
    notificationBell: path.join(
      root,
      "src/components/notifications/notification-bell.tsx",
    ),
    messagesPage: path.join(root, "src/app/(app)/messages/page.tsx"),
    feedError: path.join(root, "src/app/(app)/feed/error.tsx"),
    migration: path.join(
      root,
      "prisma/migrations/20250610230000_notifications_messages/migration.sql",
    ),
  };

  for (const [id, filePath] of Object.entries(paths)) {
    checks.push({
      id,
      label: `${path.basename(filePath)} present`,
      ok: existsSync(filePath),
      detail: filePath.replace(root + path.sep, ""),
    });
  }

  const dbOk = await isDatabaseAvailable();
  checks.push({
    id: "database",
    label: "Database available for notifications and messages",
    ok: dbOk,
    hint: dbOk ? undefined : "Phase 7 features need DATABASE_URL.",
  });

  if (dbOk) {
    try {
      const tables = await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('Notification', 'Conversation', 'Message')
      `;
      const found = new Set(tables.map((row) => row.table_name));
      const required = ["Notification", "Conversation", "Message"];
      const missing = required.filter((name) => !found.has(name));

      checks.push({
        id: "tables",
        label: "Notification and messaging tables exist",
        ok: missing.length === 0,
        detail: missing.length ? `Missing: ${missing.join(", ")}` : undefined,
        hint:
          missing.length > 0
            ? "Run prisma migrate deploy or scripts/apply-pending-migrations-neon.sql section 7."
            : undefined,
      });
    } catch (error) {
      checks.push({
        id: "tables",
        label: "Notification and messaging tables exist",
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
