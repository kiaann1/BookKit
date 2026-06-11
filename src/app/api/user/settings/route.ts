import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { resolveAvatarUrl } from "@/lib/storage/avatar";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/security/sanitize";
import { userSettingsSchema } from "@/lib/validations/user";

async function requireDatabase() {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      {
        error:
          "Settings require a database connection. Set DATABASE_URL and unset SKIP_DATABASE.",
      },
      { status: 503 },
    );
  }

  return null;
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbError = await requireDatabase();
  if (dbError) {
    return dbError;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      firstName: true,
      lastName: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      genrePreferences: true,
      booksPerWeek: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      avatarUrl: resolveAvatarUrl(auth.userId, user.avatarUrl),
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbError = await requireDatabase();
  if (dbError) {
    return dbError;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = userSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const firstName =
    data.firstName !== undefined
      ? sanitizePlainText(data.firstName, { maxLength: 60 })
      : undefined;
  const lastName =
    data.lastName !== undefined
      ? sanitizePlainText(data.lastName, { maxLength: 60 })
      : undefined;
  const bio =
    data.bio !== undefined
      ? sanitizeOptionalPlainText(data.bio, { maxLength: 500 })
      : undefined;
  const displayName =
    firstName !== undefined || lastName !== undefined
      ? [firstName, lastName].filter(Boolean).join(" ").trim()
      : undefined;

  if (data.username) {
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
  }

  try {
    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(displayName !== undefined
          ? { name: displayName || null }
          : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(data.genrePreferences !== undefined
          ? { genrePreferences: data.genrePreferences }
          : {}),
        ...(data.booksPerWeek !== undefined
          ? { booksPerWeek: data.booksPerWeek }
          : {}),
      },
      select: {
        firstName: true,
        lastName: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        genrePreferences: true,
        booksPerWeek: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/recommendations");
    revalidatePath("/profile");
    revalidatePath(`/u/${user.username}`);
    revalidatePath("/feed");

    return NextResponse.json({
      user: {
        ...user,
        avatarUrl: resolveAvatarUrl(auth.userId, user.avatarUrl),
      },
    });
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

    return NextResponse.json(
      { error: "Could not save settings. Please try again." },
      { status: 500 },
    );
  }
}
