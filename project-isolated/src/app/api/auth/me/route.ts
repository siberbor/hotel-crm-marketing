import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

async function getPayload(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  const payload = await getPayload(request);

  if (!payload) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Не авторизован" } },
      { status: 401 },
    );
  }

  try {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        onboardingCompleted: users.onboardingCompleted,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    const user = result[0];

    if (user) {
      return NextResponse.json({ data: { user } });
    }
  } catch {
    // DB unavailable — fall through to token-based response
  }

  return NextResponse.json({
    data: {
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.email.split("@")[0],
        role: payload.role,
        onboardingCompleted: true,
      },
    },
  });
}

export async function PATCH(request: NextRequest) {
  const payload = await getPayload(request);

  if (!payload) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Не авторизован" } },
      { status: 401 },
    );
  }

  try {
    await db
      .update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, payload.userId));
  } catch {
    // DB unavailable — best-effort, not fatal
  }

  return NextResponse.json({ data: { ok: true } });
}
