import { existsSync } from "fs";
import path from "path";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";

export type Phase5Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  hint?: string;
};

export type Phase5Report = {
  ok: boolean;
  checks: Phase5Check[];
};

function pushCheck(checks: Phase5Check[], check: Phase5Check) {
  checks.push(check);
}

export async function runPhase5Checks(): Promise<Phase5Report> {
  const checks: Phase5Check[] = [];
  const root = process.cwd();

  const paths = {
    followLib: path.join(root, "src/lib/social/follow.ts"),
    postsLib: path.join(root, "src/lib/social/posts.ts"),
    publicProfileLib: path.join(root, "src/lib/social/public-profile.ts"),
    postsApi: path.join(root, "src/app/api/posts/route.ts"),
    followApi: path.join(
      root,
      "src/app/api/users/[username]/follow/route.ts",
    ),
    feedPage: path.join(root, "src/app/(app)/feed/page.tsx"),
    publicProfilePage: path.join(root, "src/app/(app)/u/[username]/page.tsx"),
    composePost: path.join(root, "src/components/social/compose-post-sheet.tsx"),
    postCard: path.join(root, "src/components/social/post-card.tsx"),
    avatarSettings: path.join(root, "src/components/settings/avatar-settings.tsx"),
    bookSearchApi: path.join(root, "src/app/api/books/search/route.ts"),
    userSearchApi: path.join(root, "src/app/api/users/search/route.ts"),
    userSearchLib: path.join(root, "src/lib/social/search-users.ts"),
    peoplePage: path.join(root, "src/app/(app)/people/page.tsx"),
    userSearchUi: path.join(root, "src/components/social/user-search.tsx"),
    migration: path.join(
      root,
      "prisma/migrations/20250610170000_social_core/migration.sql",
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
    label: "Database available for social graph",
    ok: dbOk,
    hint: dbOk ? undefined : "Social features need DATABASE_URL.",
  });

  if (dbOk) {
    try {
      const tables = await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('Follow', 'Post', 'PostLike', 'Comment', 'PostReport')
      `;
      const found = new Set(tables.map((row) => row.table_name));
      const required = ["Follow", "Post", "PostLike", "Comment", "PostReport"];
      const missing = required.filter((name) => !found.has(name));

      pushCheck(checks, {
        id: "social_tables",
        label: "Social tables migrated",
        ok: missing.length === 0,
        detail:
          missing.length === 0
            ? "Follow, Post, PostLike, Comment, PostReport"
            : `missing: ${missing.join(", ")}`,
        hint:
          missing.length === 0
            ? undefined
            : "Run npm run db:migrate or prisma migrate deploy on Neon.",
      });
    } catch (error) {
      pushCheck(checks, {
        id: "social_tables",
        label: "Social tables migrated",
        ok: false,
        detail: error instanceof Error ? error.message : "Could not inspect tables",
        hint: "Run prisma migrate deploy on Neon.",
      });
    }
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}
