import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";

// Полностью публичные пути
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/guest",
  "/staff/login",
  "/guest",
  "/guest/login",
];

// Маршруты ЛК гостя — требуют scope=guest
const GUEST_PROTECTED_PREFIXES = ["/guest/bookings", "/guest/services"];

// Маршруты staff portal — требуют scope=staff (или любую CRM роль)
const STAFF_PORTAL_PREFIXES = ["/staff/rooms", "/staff/tasks", "/staff/employees", "/staff/checkin"];

function unauthorized(message = "Требуется авторизация") {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message } },
    { status: 401 },
  );
}

function forbidden(message = "Недостаточно прав") {
  return NextResponse.json(
    { error: { code: "FORBIDDEN", message } },
    { status: 403 },
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Публичные пути — пропускаем
  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/public/")
  ) {
    return NextResponse.next();
  }

  // Статические ресурсы и публичный контент гостевого раздела
  if (
    pathname.startsWith("/guest/login") ||
    pathname.startsWith("/staff/login")
  ) {
    return NextResponse.next();
  }

  // ЛК гостя — нужен scope=guest
  if (GUEST_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("guest_token")?.value;
    if (!token) return unauthorized();

    const payload = await verifyToken(token);
    if (!payload || payload.scope !== "guest") return unauthorized("Сессия истекла");

    const headers = new Headers(request.headers);
    headers.set("x-guest", JSON.stringify(payload));
    return NextResponse.next({ request: { headers } });
  }

  // Staff portal — нужен staff токен
  if (STAFF_PORTAL_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload || payload.scope === "guest") {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }

    const headers = new Headers(request.headers);
    headers.set("x-user", JSON.stringify(payload));
    return NextResponse.next({ request: { headers } });
  }

  // Guest API — нужен scope=guest
  if (pathname.startsWith("/api/guest/")) {
    const token = request.cookies.get("guest_token")?.value;
    if (!token) return unauthorized();

    const payload = await verifyToken(token);
    if (!payload || payload.scope !== "guest") return unauthorized("Сессия истекла");

    const headers = new Headers(request.headers);
    headers.set("x-guest", JSON.stringify(payload));
    return NextResponse.next({ request: { headers } });
  }

  // CRM API — нужен staff токен
  if (pathname.startsWith("/api/") && !pathname.includes("/auth/")) {
    const token = request.cookies.get("token")?.value;
    if (!token) return unauthorized();

    const payload = await verifyToken(token);
    if (!payload) return unauthorized("Сессия истекла");
    if (payload.scope === "guest") return forbidden();

    const headers = new Headers(request.headers);
    headers.set("x-user", JSON.stringify(payload));
    return NextResponse.next({ request: { headers } });
  }

  // CRM app pages — нужен staff токен, редирект на логин
  if (pathname.startsWith("/app/") || pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload || payload.scope === "guest") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
