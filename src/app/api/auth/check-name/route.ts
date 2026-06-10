import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/db";
import { getNameBasedRecommendations } from "@/lib/user/name-insights";
import { buildAvailableUsernameSuggestions } from "@/lib/user/username";
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
  const auth = await getAuthenticatedUser();

  const matches = await prisma.user.count({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
      ...(auth ? { NOT: { id: auth.userId } } : {}),
    },
  });

  const { genres } = getNameBasedRecommendations(firstName, lastName);
  const usernameSuggestions = await buildAvailableUsernameSuggestions(
    firstName,
    lastName,
    auth?.userId,
  );

  return NextResponse.json({
    count: matches,
    isTaken: matches > 0,
    usernameSuggestions,
    suggestedGenres: genres,
  });
}
