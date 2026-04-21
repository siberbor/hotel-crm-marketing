import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/auth/jwt";
import { z } from "zod";
import * as bookingService from "@/services/booking.service";

const CreateGuestBookingSchema = z.object({
  roomId: z.number({ required_error: "Выберите номер" }),
  checkIn: z.string().min(1, "Укажите дату заезда"),
  checkOut: z.string().min(1, "Укажите дату выезда"),
  totalPrice: z.string(),
  notes: z.string().optional(),
});

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный запрос" } },
      { status: 400 },
    );
  }

  const parsed = CreateGuestBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  const checkInDate = new Date(parsed.data.checkIn);
  const checkOutDate = new Date(parsed.data.checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный формат дат" } },
      { status: 400 },
    );
  }

  if (checkOutDate <= checkInDate) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Дата выезда должна быть позже даты заезда" } },
      { status: 400 },
    );
  }

  // Check for conflicts
  const hasConflict = await bookingService.checkRoomConflict(
    parsed.data.roomId,
    checkInDate,
    checkOutDate,
  );

  if (hasConflict) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Номер недоступен на выбранные даты" } },
      { status: 409 },
    );
  }

  try {
    const booking = await bookingService.createBooking({
      guestId: payload.guestId,
      roomId: parsed.data.roomId,
      checkInDate,
      checkOutDate,
      totalPrice: parsed.data.totalPrice,
      source: "guest_portal",
      notes: parsed.data.notes,
    });

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка создания бронирования" } },
      { status: 500 },
    );
  }
}
