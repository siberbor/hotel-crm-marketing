import { NextRequest, NextResponse } from "next/server";
import * as bookingService from "@/services/booking.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { z } from "zod";

const CreateBookingSchema = z.object({
  guestId: z.number({ required_error: "ID гостя обязателен" }),
  roomId: z.number({ required_error: "ID номера обязателен" }),
  checkInDate: z.string().datetime().or(z.string().date()),
  checkOutDate: z.string().datetime().or(z.string().date()),
  totalPrice: z.string(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateBookingSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled"])
    .optional(),
  paidAmount: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const guestId = searchParams.get("guestId");

  try {
    let result;
    if (guestId) {
      const data = await bookingService.getBookingsByGuest(parseInt(guestId));
      result = { data, total: data.length, page: 1, limit: data.length };
    } else if (status === "active") {
      const data = await bookingService.getActiveBookings();
      result = { data, total: data.length, page: 1, limit: data.length };
    } else {
      result = await bookingService.getAllBookings(page, limit);
    }
    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка получения бронирований",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const perm = await permissionsMiddleware(request, "bookings", "create");
  if (perm) return perm;

  try {
    const body = await request.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0].message,
          },
        },
        { status: 400 },
      );
    }

    const checkInDate = new Date(parsed.data.checkInDate);
    const checkOutDate = new Date(parsed.data.checkOutDate);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Некорректная дата заезда/выезда",
          },
        },
        { status: 400 },
      );
    }

    const booking = await bookingService.createBooking({
      ...parsed.data,
      checkInDate,
      checkOutDate,
    });
    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка создания бронирования",
        },
      },
      { status: 500 },
    );
  }
}
