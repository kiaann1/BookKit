import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/db";
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
  const displayName =
    data.displayName?.trim() ||
    [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      name: displayName || undefined,
      genrePreferences: data.genrePreferences,
      booksPerWeek: data.booksPerWeek,
      bio: data.bio?.trim() || null,
      avatarUrl: data.avatarUrl ?? undefined,
      onboardingCompletedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      onboardingCompletedAt: true,
    },
  });

  return NextResponse.json({ user });
}
