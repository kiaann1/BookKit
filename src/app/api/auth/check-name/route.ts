import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buildDisplayNameSuggestions,
  getNameBasedRecommendations,
} from "@/lib/user/name-insights";
import { checkNameSchema } from "@/lib/validations/user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = checkNameSchema.safeParse({
    firstName: searchParams.get("firstName") ?? "",
    lastName: searchParams.get("lastName") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const { firstName, lastName } = parsed.data;

  const matches = await prisma.user.count({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });

  const { genres, books } = getNameBasedRecommendations(firstName, lastName);

  return NextResponse.json({
    count: matches,
    isTaken: matches > 0,
    displayNameSuggestions: buildDisplayNameSuggestions(
      firstName,
      lastName,
      matches,
    ),
    suggestedGenres: genres,
    bookRecommendations: books,
  });
}
