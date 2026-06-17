import { type NextRequest, NextResponse } from "next/server";

const ADMIN_TOKEN_COOKIE = "brandnbeauty_admin_token";

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:css|js|map|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)$/i.test(
      pathname,
    )
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const isLoginRoute = pathname === "/login";

  if (!token && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (token && isLoginRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";

    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico).*)"],
};
