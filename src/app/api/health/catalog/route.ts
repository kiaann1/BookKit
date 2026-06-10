import { NextResponse } from "next/server";
import { BookStatus } from "@/lib/constants/book-status";
import { prisma } from "@/lib/db";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const skipDatabase = process.env.SKIP_DATABASE === "true";

  if (!hasDatabaseUrl || skipDatabase) {
    return NextResponse.json({
      ok: false,
      hasDatabaseUrl,
      skipDatabase,
      publishedBookCount: 0,
      error: skipDatabase
        ? "SKIP_DATABASE is set — catalog only reads local storage (empty on Vercel)."
        : "DATABASE_URL is not set on this deployment.",
    });
  }

  try {
    const publishedBookCount = await prisma.book.count({
      where: { status: BookStatus.PUBLISHED },
    });

    return NextResponse.json({
      ok: publishedBookCount > 0,
      hasDatabaseUrl: true,
      skipDatabase: false,
      publishedBookCount,
      hint:
        publishedBookCount === 0
          ? "Run scripts/seed-books.sql in the Neon SQL Editor."
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      ok: false,
      hasDatabaseUrl: true,
      publishedBookCount: 0,
      error: message,
    });
  }
}
