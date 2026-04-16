import { test, expect, vi, beforeEach } from "vitest";

const makeChain = (result: unknown) => {
  const p = Promise.resolve(result) as any;
  p.from = vi.fn(() => makeChain(result));
  p.where = vi.fn(() => makeChain(result));
  p.limit = vi.fn(() => makeChain(result));
  p.offset = vi.fn(() => makeChain(result));
  p.orderBy = vi.fn(() => makeChain(result));
  p.returning = vi.fn(() => Promise.resolve(result));
  return p;
};

vi.mock("@/db", () => {
  const mockSelect = vi.fn(() => makeChain([]));
  const mockInsert = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  }));
  const mockUpdate = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  }));
  // "delete" is reserved keyword, use string key
  const mockDelete = vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  }));

  const db = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  };

  return {
    db,
    bookings: { __brand: "table" },
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      __sql: true,
      strings,
      values,
    }),
  };
});

import { db } from "@/db";
import {
  getAllBookings,
  getBookingById,
  getBookingsByGuest,
  getActiveBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} from "@/services/booking.service";

const mockDb = db as any;

const sampleBooking = {
  id: 1,
  guestId: 1,
  roomId: 1,
  checkInDate: new Date("2024-06-01"),
  checkOutDate: new Date("2024-06-05"),
  status: "confirmed",
  totalPrice: "5000",
  paidAmount: "0",
  paymentStatus: "unpaid",
  source: "direct",
  notes: "Test booking",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("getAllBookings returns paginated bookings", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleBooking]));
  mockDb.select.mockReturnValueOnce(makeChain([{ total: 1 }]));
  const result = await getAllBookings(1, 20);
  expect(result.data).toEqual([sampleBooking]);
  expect(result.total).toBe(1);
});

test("getBookingById returns booking when found", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleBooking]));
  const result = await getBookingById(1);
  expect(result).toEqual(sampleBooking);
});

test("getBookingById returns null when not found", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([]));
  const result = await getBookingById(999);
  expect(result).toBeNull();
});

test("getBookingsByGuest returns list", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleBooking]));
  const result = await getBookingsByGuest(1);
  expect(result).toEqual([sampleBooking]);
});

test("getActiveBookings returns confirmed/checked_in", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleBooking]));
  const result = await getActiveBookings();
  expect(result).toEqual([sampleBooking]);
});

test("createBooking returns created booking", async () => {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([sampleBooking])),
    })),
  });
  const result = await createBooking({
    guestId: 1,
    roomId: 1,
    checkInDate: new Date("2024-06-01"),
    checkOutDate: new Date("2024-06-05"),
    totalPrice: "5000",
  });
  expect(result).toEqual(sampleBooking);
});

test("updateBooking returns updated booking", async () => {
  const updated = { ...sampleBooking, status: "checked_in" };
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([updated])),
      })),
    })),
  });
  const result = await updateBooking(1, { status: "checked_in" });
  expect(result?.status).toBe("checked_in");
});

test("updateBooking returns null when not found", async () => {
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  });
  const result = await updateBooking(999, { status: "checked_in" });
  expect(result).toBeNull();
});

test("updateBookingStatus delegates", async () => {
  const updated = { ...sampleBooking, status: "checked_out" };
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([updated])),
      })),
    })),
  });
  const result = await updateBookingStatus(1, "checked_out");
  expect(result?.status).toBe("checked_out");
});

test("deleteBooking returns true", async () => {
  mockDb["delete"].mockReturnValueOnce({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([sampleBooking])),
    })),
  });
  const result = await deleteBooking(1);
  expect(result).toBe(true);
});

test("deleteBooking returns false", async () => {
  mockDb["delete"].mockReturnValueOnce({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  });
  const result = await deleteBooking(999);
  expect(result).toBe(false);
});
