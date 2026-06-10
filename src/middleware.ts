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
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
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
    "/login",
    "/register",
    "/forgot-password",
  ],
};
