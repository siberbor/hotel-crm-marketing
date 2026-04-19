import { and, eq, gt, lt, not, inArray, or, sql } from "drizzle-orm";
import { db, bookings, type Booking as DbBooking } from "@/db";
import { demoStore } from "@/lib/demo-store";

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

export async function getAllBookings(page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    const [data, [{ total }]] = await Promise.all([
      db.select().from(bookings).limit(limit).offset(offset).orderBy(bookings.createdAt),
      db.select({ total: sql<number>`count(*)` }).from(bookings),
    ]);
    if (Number(total) > 0) return { data, total: Number(total), page, limit };
    return demoStore.getBookings(page, limit) as unknown as { data: Booking[]; total: number; page: number; limit: number };
  } catch {
    return demoStore.getBookings(page, limit) as unknown as { data: Booking[]; total: number; page: number; limit: number };
  }
}

export async function getBookingById(id: number) {
  try {
    const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(bookings);
    if (Number(total) === 0) return (demoStore.getBookingById(id) as unknown as Booking) || null;
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0] || null;
  } catch {
    return (demoStore.getBookingById(id) as unknown as Booking) || null;
  }
}

export async function getBookingsByGuest(guestId: number) {
  try {
    return db.select().from(bookings).where(eq(bookings.guestId, guestId)).orderBy(bookings.checkInDate);
  } catch {
    return demoStore.getBookingsByGuest(guestId) as unknown as Booking[];
  }
}

export async function getActiveBookings() {
  try {
    return db.select().from(bookings).where(or(eq(bookings.status, "confirmed"), eq(bookings.status, "checked_in")));
  } catch {
    return demoStore.getActiveBookings() as unknown as Booking[];
  }
}

export async function createBooking(input: CreateBookingInput) {
  try {
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
  } catch {
    return demoStore.createBooking(input) as unknown as Booking;
  }
}

export async function updateBooking(id: number, input: UpdateBookingInput) {
  try {
    const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(bookings);
    if (Number(total) === 0 && input.status) {
      return demoStore.updateBookingStatus(id, input.status as "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled") as unknown as Booking;
    }
    const result = await db.update(bookings).set({ ...input, updatedAt: new Date() }).where(eq(bookings.id, id)).returning();
    return result[0] || null;
  } catch {
    if (input.status) {
      return demoStore.updateBookingStatus(id, input.status as "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled") as unknown as Booking;
    }
    return null;
  }
}

export async function updateBookingStatus(id: number, status: Booking["status"]) {
  return updateBooking(id, { status });
}

export async function checkRoomConflict(
  roomId: number,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: number
): Promise<boolean> {
  const conditions = [
    eq(bookings.roomId, roomId),
    not(inArray(bookings.status, ["cancelled"])),
    lt(bookings.checkInDate, checkOut),
    gt(bookings.checkOutDate, checkIn),
  ];
  if (excludeBookingId) {
    conditions.push(not(eq(bookings.id, excludeBookingId)));
  }
  const result = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(...conditions))
    .limit(1);
  return result.length > 0;
}

export async function deleteBooking(id: number) {
  try {
    const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(bookings);
    if (Number(total) === 0) return demoStore.deleteBooking(id) as boolean;
    const result = await db.delete(bookings).where(eq(bookings.id, id)).returning();
    return result.length > 0;
  } catch {
    return demoStore.deleteBooking(id) as boolean;
  }
}
