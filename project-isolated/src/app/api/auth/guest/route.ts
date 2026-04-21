import { NextRequest, NextResponse } from "next/server";
import { createGuestToken } from "@/auth/jwt";
import * as bcrypt from "bcrypt";
import { db, guestAccounts } from "@/db";
import { eq } from "drizzle-orm";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = RATE_LIMIT.get(ip);
  if (!record || now > record.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Слишком много попыток. Попробуйте позже." } },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Email и пароль обязательны" } },
        { status: 400 },
      );
    }

    const [account] = await db
      .select()
      .from(guestAccounts)
      .where(eq(guestAccounts.email, email.toLowerCase()))
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Неверный email или пароль" } },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Неверный email или пароль" } },
        { status: 401 },
      );
    }

    const token = await createGuestToken({
      userId: account.id,
      email: account.email,
      guestId: account.guestId,
    });

    const response = NextResponse.json({
      data: { guestId: account.guestId, email: account.email },
    });

    response.cookies.set("guest_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" } },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.delete("guest_token");
  return response;
}
