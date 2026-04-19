import { test, expect, vi, beforeEach, describe } from "vitest";

// ── Hoisted mocks (vi.mock is hoisted before variable declarations) ────────────

const { mockDb, mockCheckRoomConflict, mockCreateBooking } = vi.hoisted(() => {
  const makeChain = (result: unknown): any => {
    const p = Promise.resolve(result) as any;
    p.from = vi.fn(() => makeChain(result));
    p.where = vi.fn(() => makeChain(result));
    p.limit = vi.fn(() => makeChain(result));
    p.returning = vi.fn(() => Promise.resolve(result));
    return p;
  };

  const mockDb = {
    select: vi.fn(() => makeChain([])),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([])) })),
    })),
    _makeChain: makeChain,
  };

  return {
    mockDb,
    mockCheckRoomConflict: vi.fn(),
    mockCreateBooking: vi.fn(),
  };
});

vi.mock("@/db", () => ({
  db: mockDb,
  syncLogs: { __brand: "syncLogs" },
  rooms:    { __brand: "rooms" },
  guests:   { __brand: "guests" },
  bookings: { __brand: "bookings" },
}));

vi.mock("@/services/booking.service", () => ({
  checkRoomConflict: mockCheckRoomConflict,
  createBooking: mockCreateBooking,
}));

import { channelManagerService } from "@/integrations/channel-manager";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChain(result: unknown): any {
  const p = Promise.resolve(result) as any;
  p.from = vi.fn(() => makeChain(result));
  p.where = vi.fn(() => makeChain(result));
  p.limit = vi.fn(() => makeChain(result));
  p.returning = vi.fn(() => Promise.resolve(result));
  return p;
}

function mockInsertLog() {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([{ id: 1 }])) })),
  });
}

function mockGuestInsert(id: number) {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([{ id }])) })),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue(makeChain([]));
  mockDb.insert.mockReturnValue({
    values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([{ id: 1 }])) })),
  });
  mockCheckRoomConflict.mockResolvedValue(false);
  mockCreateBooking.mockResolvedValue({ id: 99 });
});

// ── fetchBookings ─────────────────────────────────────────────────────────────

describe("fetchBookings", () => {
  test("creates bookings for new external entries", async () => {
    // 2 channels × 2 mock bookings = 4 pipelines
    // Each: isAlreadyProcessed→[], findRoom→[{id:1}], findGuest→[], guestInsert, successLog
    for (let i = 0; i < 4; i++) {
      mockDb.select
        .mockReturnValueOnce(makeChain([]))           // isAlreadyProcessed → new
        .mockReturnValueOnce(makeChain([{ id: 1 }])) // findRoom → found
        .mockReturnValueOnce(makeChain([]));          // findGuest → not found
      mockGuestInsert(10 + i);
      mockInsertLog();
    }

    const result = await channelManagerService.fetchBookings();

    expect(result.created).toBe(4);
    expect(result.conflicts).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockCreateBooking).toHaveBeenCalledTimes(4);
  });

  test("skips already-processed bookings (idempotency)", async () => {
    for (let i = 0; i < 4; i++) {
      mockDb.select.mockReturnValueOnce(makeChain([{ id: 1 }])); // already processed
    }

    const result = await channelManagerService.fetchBookings();

    expect(result.skipped).toBe(4);
    expect(result.created).toBe(0);
    expect(mockCreateBooking).not.toHaveBeenCalled();
  });

  test("records conflict when dates overlap", async () => {
    mockCheckRoomConflict.mockResolvedValue(true);

    for (let i = 0; i < 4; i++) {
      mockDb.select
        .mockReturnValueOnce(makeChain([]))           // isAlreadyProcessed → new
        .mockReturnValueOnce(makeChain([{ id: 1 }])); // findRoom → found
      mockInsertLog(); // conflict log
    }

    const result = await channelManagerService.fetchBookings();

    expect(result.conflicts).toBe(4);
    expect(result.created).toBe(0);
    expect(mockCreateBooking).not.toHaveBeenCalled();
  });

  test("records error when room number not found in DB", async () => {
    for (let i = 0; i < 4; i++) {
      mockDb.select
        .mockReturnValueOnce(makeChain([]))  // isAlreadyProcessed → new
        .mockReturnValueOnce(makeChain([])); // findRoom → NOT found
      mockInsertLog();
    }

    const result = await channelManagerService.fetchBookings();

    expect(result.errors).toBe(4);
    expect(result.created).toBe(0);
  });

  test("reuses existing guest when email matches", async () => {
    for (let i = 0; i < 4; i++) {
      mockDb.select
        .mockReturnValueOnce(makeChain([]))           // isAlreadyProcessed → new
        .mockReturnValueOnce(makeChain([{ id: 1 }])) // findRoom → found
        .mockReturnValueOnce(makeChain([{ id: 7 }])); // findGuest → FOUND
      mockInsertLog();
    }

    await channelManagerService.fetchBookings();

    // Insert called only for syncLogs, NOT for guests
    const insertCalls: any[][] = mockDb.insert.mock.calls;
    const tables = insertCalls.map((c) => c[0]?.__brand);
    expect(tables).not.toContain("guests");
    expect(mockCreateBooking).toHaveBeenCalledTimes(4);
    // createBooking called with guestId=7
    expect(mockCreateBooking.mock.calls[0][0].guestId).toBe(7);
  });
});

// ── pushRates ─────────────────────────────────────────────────────────────────

describe("pushRates", () => {
  test("returns success with count of rooms pushed", async () => {
    mockDb.select.mockReturnValueOnce(
      makeChain([{ number: "101", price: "3000" }, { number: "102", price: "5000" }])
    );
    mockInsertLog();

    const result = await channelManagerService.pushRates();

    expect(result.success).toBe(true);
    expect(result.itemsProcessed).toBe(2);
  });

  test("filters by roomId when provided", async () => {
    mockDb.select.mockReturnValueOnce(makeChain([{ number: "101", price: "3000" }]));
    mockInsertLog();

    const result = await channelManagerService.pushRates(1);

    expect(result.success).toBe(true);
    expect(result.itemsProcessed).toBe(1);
  });

  test("returns failure when DB throws", async () => {
    mockDb.select.mockImplementationOnce(() => { throw new Error("DB down"); });

    const result = await channelManagerService.pushRates();

    expect(result.success).toBe(false);
    expect(result.errors).toBe(1);
    expect(result.errorMessage).toContain("DB down");
  });
});
