import { auth } from "@/lib/auth";
import { isAuthDisabled } from "@/lib/dev-auth";
import { NextResponse } from "next/server";

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

function handleAuth(req: Parameters<Parameters<typeof auth>[0]>[0]) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

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

export default isAuthDisabled()
  ? () => NextResponse.next()
  : auth(handleAuth);

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
