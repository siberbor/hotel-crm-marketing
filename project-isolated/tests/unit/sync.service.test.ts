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

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
    },
    syncLogs: { __brand: "table" },
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      __sql: true,
      strings,
      values,
    }),
  };
});

import { db } from "@/db";
import {
  getAllSyncLogs,
  addSyncLog,
  syncWithChannel,
} from "@/services/sync.service";

const mdb = db as any;

const sampleSyncLog = {
  id: 1,
  channel: "booking_com",
  externalId: "ext_123",
  action: "sync",
  status: "success",
  errorMessage: null,
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("getAllSyncLogs returns paginated logs with total", async () => {
  mdb.select.mockReturnValueOnce(makeChain([sampleSyncLog]));
  mdb.select.mockReturnValueOnce(makeChain([{ total: 1 }]));
  const result = await getAllSyncLogs(1, 20);
  expect(result.data).toEqual([sampleSyncLog]);
  expect(result.total).toBe(1);
});

test("getAllSyncLogs with default pagination", async () => {
  mdb.select.mockReturnValueOnce(makeChain([]));
  mdb.select.mockReturnValueOnce(makeChain([{ total: 0 }]));
  const result = await getAllSyncLogs();
  expect(result.page).toBe(1);
  expect(result.limit).toBe(20);
});

test("addSyncLog creates success log", async () => {
  mdb.insert.mockReturnValueOnce({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([sampleSyncLog])),
    })),
  });
  const result = await addSyncLog("booking_com", "sync", "ext_123");
  expect(result?.status).toBe("success");
});

test("addSyncLog creates failed log when error provided", async () => {
  const failedLog = {
    ...sampleSyncLog,
    status: "failed" as const,
    errorMessage: "Failed",
  };
  mdb.insert.mockReturnValueOnce({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([failedLog])),
    })),
  });
  const result = await addSyncLog("booking_com", "sync", "ext_123", "Failed");
  expect(result?.status).toBe("failed");
});

test("syncWithChannel creates sync log and returns success", async () => {
  mdb.insert.mockReturnValueOnce({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([sampleSyncLog])),
    })),
  });
  const result = await syncWithChannel("booking_com");
  expect(result.success).toBe(true);
  expect(result.channel).toBe("booking_com");
  expect(mdb.insert).toHaveBeenCalled();
});
