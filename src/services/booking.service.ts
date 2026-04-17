import { eq, or } from "drizzle-orm";
import { db, bookings, type Booking as DbBooking } from "@/db";

export type Booking = DbBooking;

export type CreateBookingInput = {
  guestId: number;
  roomId: number;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: string;
  source?: string;
  notes?: string;
};

export type UpdateBookingInput = Partial<
  CreateBookingInput & { status: Booking["status"]; paidAmount: string }
>;

import { sql } from "drizzle-orm";

export async function getAllBookings(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(bookings)
      .limit(limit)
      .offset(offset)
      .orderBy(bookings.createdAt),
    db.select({ total: sql<number>`count(*)` }).from(bookings),
  ]);

  return { data, total: Number(total), page, limit };
}

export async function getBookingById(id: number) {
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getBookingsByGuest(guestId: number) {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.guestId, guestId))
    .orderBy(bookings.checkInDate);
}

export async function getActiveBookings() {
  return db
    .select()
    .from(bookings)
    .where(
      or(eq(bookings.status, "confirmed"), eq(bookings.status, "checked_in")),
    );
}

export async function createBooking(input: CreateBookingInput) {
  const [created] = await db
    .insert(bookings)
    .values({
      guestId: input.guestId,
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      totalPrice: input.totalPrice,
      source: input.source || null,
      notes: input.notes || null,
      status: "pending",
      paidAmount: "0",
      paymentStatus: "unpaid",
    })
    .returning();
  return created;
}

export async function updateBooking(id: number, input: UpdateBookingInput) {
  const result = await db
    .update(bookings)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();
  return result[0] || null;
}

export async function updateBookingStatus(
  id: number,
  status: Booking["status"],
) {
  return updateBooking(id, { status });
}

export async function deleteBooking(id: number) {
  const result = await db
    .delete(bookings)
    .where(eq(bookings.id, id))
    .returning();
  return result.length > 0;
}
