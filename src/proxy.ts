import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  getSafeRedirectPath,
  isAuthenticated,
} from "@/lib/auth";

const protectedRoutes = [
  "/",
  "/orders",
  "/orders/details",
  "/products",
  "/products/edit",
  "/inventory",
  "/customers",
  "/customers/profile",
  "/banners",
  "/finance",
  "/reports",
  "/settings",
] as const;

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const loggedIn = isAuthenticated(sessionValue);

  if (pathname === "/login") {
    if (loggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  if (loggedIn) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", getSafeRedirectPath(pathname));

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
