import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";

const PUBLIC_PATHS = ["/", "/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some(
      (path) =>
        pathname === path ||
        (pathname.startsWith("/api/auth/") && pathname !== "/api/auth/login"),
    )
  ) {
    if (pathname === "/api/auth/logout" || pathname === "/api/auth/login") {
      return NextResponse.next();
    }
  }

  if (pathname.startsWith("/api/") && !pathname.includes("/auth/")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Требуется авторизация" } },
        { status: 401 },
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Сессия истекла" } },
        { status: 401 },
      );
    }

    request.headers.set("x-user", JSON.stringify(payload));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
