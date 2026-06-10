import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueUsername } from "@/lib/user/username";
import { registerSchema } from "@/lib/validations/auth";

function registerErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : "field";
      return `An account with that ${target} already exists.`;
    }

    if (error.code === "P2022") {
      return "Database schema is out of date. Run scripts/migrate-user-onboarding.sql in Neon.";
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Could not connect to the database. Check DATABASE_URL on the server.";
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/column.*does not exist/i.test(message)) {
    return "Database schema is out of date. Run scripts/migrate-user-onboarding.sql in Neon.";
  }

  return "Something went wrong. Please try again.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const firstName = parsed.data.firstName.trim();
    const lastName = parsed.data.lastName.trim();
    const phone = parsed.data.phone.trim();
    const displayName = `${firstName} ${lastName}`;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: { email: ["This email is already registered"] } },
        { status: 409 },
      );
    }

    const username = await generateUniqueUsername(firstName, lastName, email);
    const passwordHash = await hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        name: displayName,
        phone,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Register failed:", error);
    return NextResponse.json(
      { error: registerErrorMessage(error) },
      { status: 500 },
    );
  }
}
