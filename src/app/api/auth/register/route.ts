import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueUsername } from "@/lib/user/username";
import { registerSchema } from "@/lib/validations/auth";

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
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
