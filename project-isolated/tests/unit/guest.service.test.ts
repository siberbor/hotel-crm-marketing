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

const mockDb = {
  select: vi.fn(() => makeChain([])),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  })),
};

vi.mock("@/db", () => {
  return {
    get db() {
      return mockDb as any;
    },
    guests: { __brand: "table" },
    bookings: { __brand: "table" },
    rooms: { __brand: "table" },
    interactions: { __brand: "table" },
    campaigns: { __brand: "table" },
    syncLogs: { __brand: "table" },
    users: { __brand: "table" },
    permissions: { __brand: "table" },
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      __sql: true,
      strings,
      values,
    }),
  };
});

import {
  getAllGuests,
  getGuestById,
  searchGuests,
  createGuest,
  updateGuest,
  deleteGuest,
} from "@/services/guest.service";

const sampleGuest = {
  id: 1,
  firstName: "Иван",
  lastName: "Петров",
  email: "ivan@test.com",
  phone: "+79001234567",
  preferences: { floor: 2 },
  tags: ["vip"],
  totalVisits: 5,
  totalSpent: "15000",
  notes: "Test",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("getAllGuests returns paginated guests with total", async () => {
  (mockDb.select as any)
    .mockReturnValueOnce(makeChain([sampleGuest]))
    .mockReturnValueOnce(makeChain([{ total: 1 }]));

  const result = await getAllGuests(1, 20);
  expect(result.data).toEqual([sampleGuest]);
  expect(result.total).toBe(1);
  expect(result.page).toBe(1);
  expect(result.limit).toBe(20);
});

test("getGuestById returns guest when found", async () => {
  (mockDb.select as any).mockReturnValueOnce(makeChain([sampleGuest]));

  const result = await getGuestById(1);
  expect(result).toEqual(sampleGuest);
});

test("getGuestById returns null when not found", async () => {
  (mockDb.select as any).mockReturnValueOnce(makeChain([]));

  const result = await getGuestById(999);
  expect(result).toBeNull();
});

test("searchGuests returns matching guests", async () => {
  (mockDb.select as any).mockReturnValueOnce(makeChain([sampleGuest]));

  const result = await searchGuests("Иван");
  expect(result).toEqual([sampleGuest]);
});

test("searchGuests returns empty array when no match", async () => {
  (mockDb.select as any).mockReturnValueOnce(makeChain([]));

  const result = await searchGuests("nonexistent");
  expect(result).toEqual([]);
});

test("createGuest returns the created guest", async () => {
  (mockDb.insert as any).mockReturnValueOnce({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([sampleGuest])),
    })),
  });

  const result = await createGuest({
    firstName: "Иван",
    lastName: "Петров",
    email: "ivan@test.com",
  });
  expect(result).toEqual(sampleGuest);
});

test("updateGuest returns updated guest", async () => {
  const updated = { ...sampleGuest, firstName: "Новое" };
  (mockDb.update as any).mockReturnValueOnce({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([updated])),
      })),
    })),
  });

  const result = await updateGuest(1, { firstName: "Новое" });
  expect(result?.firstName).toBe("Новое");
});

test("updateGuest returns null when not found", async () => {
  (mockDb.update as any).mockReturnValueOnce({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  });

  const result = await updateGuest(999, { firstName: "Новое" });
  expect(result).toBeNull();
});

test("deleteGuest returns true when guest exists", async () => {
  (mockDb.delete as any).mockReturnValueOnce({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([sampleGuest])),
    })),
  });

  const result = await deleteGuest(1);
  expect(result).toBe(true);
});

test("deleteGuest returns false when guest not found", async () => {
  (mockDb.delete as any).mockReturnValueOnce({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  });

  const result = await deleteGuest(999);
  expect(result).toBe(false);
});
