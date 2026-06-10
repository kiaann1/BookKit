import { NextResponse } from "next/server";
import { BookStatus } from "@/lib/constants/book-status";
import { prisma, normalizeDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

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
    const rawUrl = process.env.DATABASE_URL ?? "";
    const normalizedUrl = normalizeDatabaseUrl(rawUrl);
    const channelBindingStripped = rawUrl !== normalizedUrl;

    const publishedBookCount = await prisma.book.count({
      where: { status: BookStatus.PUBLISHED },
    });

    const sample =
      publishedBookCount > 0
        ? await prisma.book.findMany({
            take: 3,
            where: { status: BookStatus.PUBLISHED },
            select: { id: true, title: true },
          })
        : [];

    return NextResponse.json({
      ok: publishedBookCount > 0,
      hasDatabaseUrl: true,
      skipDatabase: false,
      channelBindingStripped,
      publishedBookCount,
      sample,
      hint:
        publishedBookCount === 0
          ? "No books in the database. Log in as admin → Admin → Manage books → Seed default catalog."
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
