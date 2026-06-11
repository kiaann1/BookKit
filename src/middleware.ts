import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";

function secure(response: NextResponse) {
  applySecurityHeaders(response);
  return response;
}

const protectedRoutes = [
  "/dashboard",
  "/shelf",
  "/read",
  "/feed",
  "/people",
  "/recommendations",
  "/requests",
  "/profile",
  "/settings",
  "/u",
  "/posts",
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
    return secure(NextResponse.next());
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
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
    return secure(
      NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin)),
    );
  }

  if (isLoggedIn && onboardingCompleted && isOnboarding) {
    return secure(
      NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin)),
    );
  }

  // Admin role is enforced in app/admin/layout (requireAdmin) with a fresh DB
  // session. Do not check role here — JWT in middleware can be stale after promotion.

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return secure(NextResponse.redirect(loginUrl));
  }

  if (isOnboarding && !isLoggedIn) {
    return secure(
      NextResponse.redirect(new URL("/login", req.nextUrl.origin)),
    );
  }

  if (isAuthRoute && isLoggedIn) {
    const destination = onboardingCompleted ? "/dashboard" : "/onboarding";
    return secure(
      NextResponse.redirect(new URL(destination, req.nextUrl.origin)),
    );
  }

  return secure(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/shelf/:path*",
    "/read/:path*",
    "/feed/:path*",
    "/people/:path*",
    "/recommendations/:path*",
    "/requests/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/u/:path*",
    "/posts/:path*",
    "/admin",
    "/admin/:path*",
    "/onboarding/:path*",
    "/onboarding",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
