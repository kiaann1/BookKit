import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "forgot-password", {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;

    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] Password reset link for ${email}: ${resetUrl}`);
    }

    // TODO: Send email via Resend when configured (RESEND_API_KEY).

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
