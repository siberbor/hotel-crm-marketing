import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";
import { db, interactions, bookings } from "@/db";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("guest_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Требуется авторизация" } },
      { status: 401 },
    );
  }

  const payload = await verifyToken(token);
  if (!payload || payload.scope !== "guest" || !payload.guestId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Сессия истекла" } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { subject, content, bookingId } = body as {
      subject?: string;
      content?: string;
      bookingId?: number;
    };

    if (!content?.trim()) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Текст запроса обязателен" } },
        { status: 400 },
      );
    }

    // Verify booking belongs to this guest
    let verifiedBookingId: number | undefined;
    if (bookingId) {
      const [booking] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(bookings.guestId, payload.guestId),
            inArray(bookings.status, ["confirmed", "checked_in"]),
          ),
        )
        .limit(1);
      verifiedBookingId = booking?.id;
    }

    const [created] = await db
      .insert(interactions)
      .values({
        guestId: payload.guestId,
        bookingId: verifiedBookingId ?? null,
        userId: null,
        type: "request",
        subject: subject?.trim() || "Запрос услуги (ЛК)",
        content: content.trim(),
      })
      .returning({ id: interactions.id });

    return NextResponse.json({ data: { id: created.id } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" } },
      { status: 500 },
    );
  }
}
