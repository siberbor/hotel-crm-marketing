import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Не авторизован" } },
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

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  const user = result[0];

  if (!user) {
    return NextResponse.json(
      { error: { code: "USER_NOT_FOUND", message: "Пользователь не найден" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: { user } });
}
