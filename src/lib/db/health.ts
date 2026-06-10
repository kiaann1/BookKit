import { prisma } from "@/lib/db";

const CHECK_TTL_MS = 30_000;
const CHECK_TIMEOUT_MS = 5_000;

let cached: { ok: boolean; checkedAt: number } | null = null;

export function invalidateDatabaseHealthCache() {
  cached = null;
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function isDatabaseAvailable(): Promise<boolean> {
  if (process.env.SKIP_DATABASE === "true" || !hasDatabaseUrl()) {
    return false;
  }

  const now = Date.now();
  if (cached && now - cached.checkedAt < CHECK_TTL_MS) {
    return cached.ok;
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("database-timeout")), CHECK_TIMEOUT_MS);
      }),
    ]);
    cached = { ok: true, checkedAt: now };
    return true;
  } catch {
    cached = { ok: false, checkedAt: now };
    return false;
  }
}
