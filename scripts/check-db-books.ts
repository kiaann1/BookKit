import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrl(url: string) {
  return url.replace(/&?channel_binding=[^&]*/g, "").replace(/\?&/, "?");
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  process.env.DATABASE_URL = normalizeDatabaseUrl(raw);

  const prisma = new PrismaClient();
  try {
    const count = await prisma.book.count();
    const published = await prisma.book.count({
      where: { status: "PUBLISHED" },
    });
    const sample = await prisma.book.findMany({
      take: 5,
      select: { id: true, title: true, status: true },
    });
    console.log(JSON.stringify({ count, published, sample }, null, 2));
  } catch (error) {
    console.error("Failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
