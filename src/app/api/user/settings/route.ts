import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
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
      genrePreferences: true,
      booksPerWeek: true,
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
  const displayName =
    data.firstName !== undefined || data.lastName !== undefined
      ? [data.firstName, data.lastName].filter(Boolean).join(" ").trim()
      : undefined;

  try {
    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(displayName !== undefined
          ? { name: displayName || null }
          : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
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
        genrePreferences: true,
        booksPerWeek: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/recommendations");
    revalidatePath("/profile");

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Could not save settings. Please try again." },
      { status: 500 },
    );
  }
}
