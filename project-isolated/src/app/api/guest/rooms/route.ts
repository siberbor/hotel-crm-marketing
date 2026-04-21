import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";
import { db, rooms, bookings } from "@/db";
import { eq, and, lt, gt, not, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("guest_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Требуется авторизация" } },
      { status: 401 },
    );
  }

  const payload = await verifyToken(token);
  if (!payload || payload.scope !== "guest") {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Сессия истекла" } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const checkInStr = searchParams.get("checkIn");
  const checkOutStr = searchParams.get("checkOut");

  if (!checkInStr || !checkOutStr) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Укажите даты заезда и выезда" } },
      { status: 400 },
    );
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный формат дат" } },
      { status: 400 },
    );
  }

  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Дата выезда должна быть позже даты заезда" } },
      { status: 400 },
    );
  }

  try {
    // Find room IDs that have conflicting bookings
    const conflicted = await db
      .select({ roomId: bookings.roomId })
      .from(bookings)
      .where(
        and(
          not(inArray(bookings.status, ["cancelled"])),
          lt(bookings.checkInDate, checkOut),
          gt(bookings.checkOutDate, checkIn),
        ),
      );

    const conflictedIds = conflicted.map((r) => r.roomId).filter((id): id is number => id !== null);

    // Get all active rooms, filter out conflicted ones
    let allRooms = await db
      .select()
      .from(rooms)
      .where(eq(rooms.isActive, true));

    if (conflictedIds.length > 0) {
      allRooms = allRooms.filter((r) => !conflictedIds.includes(r.id));
    }

    return NextResponse.json({ data: allRooms });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка получения номеров" } },
      { status: 500 },
    );
  }
}
