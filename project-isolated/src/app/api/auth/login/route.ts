import { NextRequest, NextResponse } from "next/server";
import { createToken, createRefreshToken } from "@/auth/jwt";
import * as bcrypt from "bcrypt";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

const DEMO_USERS = [
  { email: "admin@hotel.com", password: "admin123", role: "admin" },
  { email: "manager@hotel.com", password: "manager123", role: "manager" },
  { email: "marketing@hotel.com", password: "marketing123", role: "marketing" },
  {
    email: "reception@hotel.com",
    password: "reception123",
    role: "receptionist",
  },
];

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = RATE_LIMIT.get(ip);

  if (!record || now > record.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

async function tryDbLogin(email: string, password: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];

    if (!user) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

function demoLogin(email: string, password: string) {
  const demoUser = DEMO_USERS.find(
    (u) => u.email === email && u.password === password,
  );

  if (demoUser) {
    return {
      id: Math.floor(Math.random() * 1000) + 100,
      email: demoUser.email,
      name: demoUser.email.split("@")[0],
      role: demoUser.role,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Слишком много попыток. Попробуйте позже.",
        },
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Email и пароль обязательны",
          },
        },
        { status: 400 },
      );
    }

    let user = await tryDbLogin(email, password);

    if (!user) {
      const demoUser = demoLogin(email, password);
      if (demoUser) {
        user = {
          id: demoUser.id,
          email: demoUser.email,
          passwordHash: "",
          name: demoUser.name,
          role: demoUser.role,
          onboardingCompleted: false,
          createdAt: null,
          updatedAt: null,
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Неверный email или пароль",
          },
        },
        { status: 401 },
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await createRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" },
      },
      { status: 500 },
    );
  }
}
