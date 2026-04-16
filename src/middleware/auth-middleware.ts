import { NextResponse, type NextRequest } from "next/server";

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    return !payload.exp || Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token");
  const mustChangePassword = req.cookies.get("must_change_password");

  if (pathname === "/super-admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard/super-admin") || pathname.startsWith("/super-admin")) {
    const superAdminToken = req.cookies.get("super_admin_token");
    if (!superAdminToken || isJwtExpired(superAdminToken.value)) {
      const response = NextResponse.redirect(new URL("/super-admin/login", req.url));
      if (superAdminToken) {
        response.cookies.delete("super_admin_token");
      }
      return response;
    }
    return NextResponse.next();
  }

  if (accessToken && isJwtExpired(accessToken.value)) {
    const response = NextResponse.redirect(new URL("/auth/v2/login", req.url));
    response.cookies.delete("access_token");
    response.cookies.delete("must_change_password");
    return response;
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
