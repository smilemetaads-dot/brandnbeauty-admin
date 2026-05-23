import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const publicFilePattern = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$/i;

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next/") ||
    publicFilePattern.test(pathname)
  );
}

function copyAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  source.headers.forEach((value, key) => {
    target.headers.set(key, value);
  });

  return target;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, supabase } = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/login" && user) {
    return copyAuthCookies(response, NextResponse.redirect(new URL("/", request.url)));
  }

  if (isPublicPath(pathname)) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${pathname}${search}`;

    if (nextPath !== "/") {
      loginUrl.searchParams.set("next", nextPath);
    }

    return copyAuthCookies(response, NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json)$).*)",
  ],
};
