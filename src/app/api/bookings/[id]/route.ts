import { NextRequest, NextResponse } from "next/server";
import * as bookingService from "@/services/booking.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { emitBookingStatusChanged } from "@/ws/index";
import { getEmailQueue } from "@/lib/queues";
import { z } from "zod";

const UpdateBookingSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled"])
    .optional(),
  paidAmount: z.string().optional(),
  totalPrice: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const booking = await bookingService.getBookingById(id);
  if (!booking) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Бронирование не найдено" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: booking });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const perm = await permissionsMiddleware(request, "bookings", "update");
  if (perm) return perm;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const parsed = UpdateBookingSchema.safeParse(body);

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

    const booking = await bookingService.updateBooking(id, {
      ...parsed.data,
      status: parsed.data.status,
    });

    if (!booking) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Бронирование не найдено" } },
        { status: 404 },
      );
    }

    if (parsed.data.status) {
      emitBookingStatusChanged(id, parsed.data.status);
      if (parsed.data.status === "cancelled" && process.env.REDIS_URL) {
        getEmailQueue().add("booking_cancellation", {
          type: "booking_cancellation",
          bookingId: id,
        }).catch(() => { /* non-critical */ });
      }
    }
    return NextResponse.json({ data: booking });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка обновления бронирования",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const perm = await permissionsMiddleware(request, "bookings", "delete");
  if (perm) return perm;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const deleted = await bookingService.deleteBooking(id);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Бронирование не найдено" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: { success: true } });
}
