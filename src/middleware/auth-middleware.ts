import { NextResponse, type NextRequest } from "next/server";

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token");
  const mustChangePassword = req.cookies.get("must_change_password");

  if (pathname.startsWith("/dashboard/super-admin") || pathname.startsWith("/super-admin")) {
    return NextResponse.next();
  }

  if (!accessToken && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/v2/login", req.url));
  }

  if (!accessToken && pathname === "/") {
    return NextResponse.redirect(new URL("/auth/v2/login", req.url));
  }

  if (accessToken && (pathname === "/auth/v2/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard/default", req.url));
  }

  if (accessToken && mustChangePassword && pathname.startsWith("/dashboard") && pathname !== "/dashboard/profile") {
    return NextResponse.redirect(new URL("/dashboard/profile?forcePasswordChange=1", req.url));
  }

  return NextResponse.next();
}
