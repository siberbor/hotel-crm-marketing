import { test, expect, vi, beforeEach } from "vitest";

const makeChain = (result: unknown) => {
  const p = Promise.resolve(result) as any;
  p.from = vi.fn(() => makeChain(result));
  p.where = vi.fn(() => makeChain(result));
  p.limit = vi.fn(() => makeChain(result));
  p.orderBy = vi.fn(() => makeChain(result));
  p.returning = vi.fn(() => Promise.resolve(result));
  return p;
};

vi.mock("@/db", () => {
  const ms = vi.fn(() => makeChain([]));
  const mi = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  }));
  const mu = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  }));
  const md = vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  }));
  const db = {
    select: ms,
    insert: mi,
    update: mu,
    delete: md,
  };
  return {
    db,
    rooms: { __brand: "table" },
  };
});

import { db } from "@/db";
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from "@/services/room.service";

const mockDb = db as any;

const sampleRoom = {
  id: 1,
  number: "101",
  type: "standard",
  floor: 1,
  pricePerNight: "2500",
  capacity: 2,
  amenities: ["wifi", "tv"],
  isActive: true,
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("getAllRooms returns active rooms ordered by number", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleRoom]));
  expect(await getAllRooms()).toEqual([sampleRoom]);
});

test("getAllRooms returns empty array when no active rooms", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([]));
  expect(await getAllRooms()).toEqual([]);
});

test("getRoomById returns room when found", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleRoom]));
  expect(await getRoomById(1)).toEqual(sampleRoom);
});

test("getRoomById returns null when not found", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([]));
  expect(await getRoomById(999)).toBeNull();
});

test("createRoom returns created room", async () => {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([sampleRoom])),
    })),
  });
  expect(
    await createRoom({
      number: "101",
      type: "standard",
      floor: 1,
      pricePerNight: "2500",
      capacity: 2,
    }),
  ).toEqual(sampleRoom);
});

test("updateRoom returns updated room", async () => {
  const updated = { ...sampleRoom, type: "deluxe" };
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([updated])),
      })),
    })),
  });
  expect((await updateRoom(1, { type: "deluxe" }))?.type).toBe("deluxe");
});

test("updateRoom returns null when not found", async () => {
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
  });
  expect(await updateRoom(999, { type: "deluxe" })).toBeNull();
});

test("deleteRoom returns true when room exists", async () => {
  mockDb.delete.mockReturnValueOnce({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{ id: 1 }])),
    })),
  });
  expect(await deleteRoom(1)).toBe(true);
});

test("deleteRoom returns false when room not found", async () => {
  mockDb.delete.mockReturnValueOnce({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([])),
    })),
  });
  expect(await deleteRoom(999)).toBe(false);
});
