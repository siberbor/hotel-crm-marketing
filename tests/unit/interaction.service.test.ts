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
  select: vi.fn(() => makeChain([])) as any,
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([]) as any),
    })) as any,
  })) as any,
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(
        () =>
          ({
            returning: vi.fn(() => Promise.resolve([]) as any),
          }) as any,
      ),
    })) as any,
  })) as any,
  delete: vi.fn(() => ({
    where: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([]) as any),
        }) as any,
    ),
  })) as any,
};

vi.mock("@/db", () => ({
  get db() {
    return mockDb;
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
}));

import {
  getAllInteractions,
  getInteractionsByGuest,
  createInteraction,
  deleteInteraction,
} from "@/services/interaction.service";

const sampleInteraction = {
  id: 1,
  guestId: 1,
  bookingId: null,
  userId: 1,
  type: "call",
  subject: "Follow up",
  content: "Called to confirm reservation",
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("getAllInteractions returns paginated interactions with total", async () => {
  mockDb.select
    .mockReturnValueOnce(makeChain([sampleInteraction]))
    .mockReturnValueOnce(makeChain([{ count: 1 }]));

  const result = await getAllInteractions(1, 20);
  expect(result.data).toEqual([sampleInteraction]);
  expect(result.total).toBe(1);
});

test("getAllInteractions with default pagination", async () => {
  mockDb.select
    .mockReturnValueOnce(makeChain([]))
    .mockReturnValueOnce(makeChain([{ count: 0 }]));

  const result = await getAllInteractions();
  expect(result.page).toBe(1);
  expect(result.limit).toBe(20);
});

test("getInteractionsByGuest returns list of interactions", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleInteraction]));

  const result = await getInteractionsByGuest(1);
  expect(result).toEqual([sampleInteraction]);
});

test("getInteractionsByGuest returns empty array", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([]));

  const result = await getInteractionsByGuest(999);
  expect(result).toEqual([]);
});

test("createInteraction returns created interaction", async () => {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([sampleInteraction]) as any),
        }) as any,
    ),
  });

  const result = await createInteraction({
    guestId: 1,
    type: "call",
    subject: "Follow up",
  });
  expect(result).toEqual(sampleInteraction);
});

test("createInteraction with optional fields", async () => {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([sampleInteraction]) as any),
        }) as any,
    ),
  });

  const result = await createInteraction({
    guestId: 1,
    bookingId: 5,
    userId: 2,
    type: "email",
    content: "Sent confirmation",
  });
  expect(result).toEqual(sampleInteraction);
});

test("deleteInteraction returns true when interaction exists", async () => {
  mockDb.delete.mockReturnValueOnce({
    where: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([sampleInteraction]) as any),
        }) as any,
    ),
  });

  const result = await deleteInteraction(1);
  expect(result).toBe(true);
});

test("deleteInteraction returns false when interaction not found", async () => {
  mockDb.delete.mockReturnValueOnce({
    where: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([]) as any),
        }) as any,
    ),
  });

  const result = await deleteInteraction(999);
  expect(result).toBe(false);
});
