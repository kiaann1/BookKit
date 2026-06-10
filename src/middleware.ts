import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/shelf",
  "/read",
  "/feed",
  "/recommendations",
  "/requests",
  "/profile",
  "/settings",
  "/admin",
];

const authRoutes = ["/login", "/register", "/forgot-password"];

function isAuthDisabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DISABLE_AUTH === "true"
  );
}

export async function middleware(req: NextRequest) {
  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
  const isLoggedIn = Boolean(token);
  const onboardingCompleted = Boolean(token?.onboardingCompleted);
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  if (isLoggedIn && !onboardingCompleted && isProtected) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  if (isLoggedIn && onboardingCompleted && isOnboarding) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isOnboarding && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isAuthRoute && isLoggedIn) {
    const destination = onboardingCompleted ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(destination, req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/shelf/:path*",
    "/read/:path*",
    "/feed/:path*",
    "/recommendations/:path*",
    "/requests/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/onboarding",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
