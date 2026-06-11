import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/db";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/security/sanitize";
import { onboardingSchema } from "@/lib/validations/user";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      name: true,
      genrePreferences: true,
      booksPerWeek: true,
      bio: true,
      avatarUrl: true,
      onboardingCompletedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const firstName = sanitizePlainText(data.firstName, { maxLength: 60 });
  const lastName = sanitizePlainText(data.lastName, { maxLength: 60 });
  const bio = sanitizeOptionalPlainText(data.bio, { maxLength: 500 });
  const displayName =
    (data.displayName
      ? sanitizePlainText(data.displayName, { maxLength: 80 })
      : null) ||
    [firstName, lastName].filter(Boolean).join(" ").trim();

  const existingUsername = await prisma.user.findUnique({
    where: { username: data.username },
    select: { id: true },
  });

  if (existingUsername && existingUsername.id !== auth.userId) {
    return NextResponse.json(
      { error: { username: ["That username is already taken."] } },
      { status: 409 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        firstName,
        lastName,
        username: data.username,
        name: displayName || undefined,
        genrePreferences: data.genrePreferences,
        booksPerWeek: data.booksPerWeek,
        bio,
        avatarUrl:
          data.avatarUrl === undefined ? undefined : data.avatarUrl,
        onboardingCompletedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        name: true,
        onboardingCompletedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: { username: ["That username is already taken."] } },
        { status: 409 },
      );
    }

    throw error;
  }
}
