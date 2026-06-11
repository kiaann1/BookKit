import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session-user";
import { isDatabaseAvailable } from "@/lib/db/health";
import { prisma } from "@/lib/db";
import { userPrivacySchema } from "@/lib/validations/privacy";

async function requireDatabase() {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Privacy settings require a database connection." },
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
      username: true,
      isPrivate: true,
      followersListVisibility: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    privacy: {
      isPrivate: user.isPrivate,
      followersListVisibility: user.followersListVisibility,
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

  const parsed = userPrivacySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      ...(data.isPrivate !== undefined ? { isPrivate: data.isPrivate } : {}),
      ...(data.followersListVisibility !== undefined
        ? { followersListVisibility: data.followersListVisibility }
        : {}),
    },
    select: {
      username: true,
      isPrivate: true,
      followersListVisibility: true,
    },
  });

  revalidatePath(`/u/${user.username}`);
  revalidatePath(`/u/${user.username}/followers`);
  revalidatePath(`/u/${user.username}/following`);
  revalidatePath("/people");
  revalidatePath("/feed");

  return NextResponse.json({
    privacy: {
      isPrivate: user.isPrivate,
      followersListVisibility: user.followersListVisibility,
    },
  });
}
