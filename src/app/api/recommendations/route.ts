import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import {
  getNewInGenreBooks,
  getRecommendationFeed,
  getRecommendationsForUser,
} from "@/lib/recommendations";

const querySchema = z.object({
  section: z.enum(["all", "for-you", "new"]).optional().default("all"),
  limit: z.coerce.number().int().min(1).max(24).optional().default(12),
  excludeOnShelf: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
});

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    section: searchParams.get("section") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    excludeOnShelf: searchParams.get("excludeOnShelf") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { section, limit, excludeOnShelf } = parsed.data;

  if (section === "for-you") {
    const books = await getRecommendationsForUser(auth.userId, {
      limit,
      excludeOnShelf,
    });
    return NextResponse.json({ books });
  }

  if (section === "new") {
    const books = await getNewInGenreBooks(auth.userId, limit);
    return NextResponse.json({ books });
  }

  const feed = await getRecommendationFeed(auth.userId);
  return NextResponse.json(feed);
}
