import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** channel_binding breaks many serverless Postgres clients (incl. Vercel). */
export function normalizeDatabaseUrl(url: string) {
  return url
    .replace(/&?channel_binding=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/\?$/, "");
}

function createPrismaClient() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const datasourceUrl = normalizeDatabaseUrl(raw);
  if (datasourceUrl !== raw) {
    process.env.DATABASE_URL = datasourceUrl;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
