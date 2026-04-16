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
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  sendCampaign,
  deleteCampaign,
} from "@/services/campaign.service";

const sampleCampaign = {
  id: 1,
  name: "Summer promotion",
  subject: "Summer deals",
  content: "<p>Check our summer deals</p>",
  segmentId: 1,
  status: "draft",
  scheduledAt: null,
  sentAt: null,
  stats: { sent: 0, opened: 0, clicked: 0 },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("getAllCampaigns returns paginated campaigns with total", async () => {
  mockDb.select
    .mockReturnValueOnce(makeChain([sampleCampaign]))
    .mockReturnValueOnce(makeChain([{ total: 1 }]));

  const result = await getAllCampaigns(1, 20);
  expect(result.data).toEqual([sampleCampaign]);
  expect(result.total).toBe(1);
  expect(result.page).toBe(1);
  expect(result.limit).toBe(20);
});

test("getAllCampaigns with default pagination", async () => {
  mockDb.select
    .mockReturnValueOnce(makeChain([]))
    .mockReturnValueOnce(makeChain([{ total: 0 }]));

  const result = await getAllCampaigns();
  expect(result.page).toBe(1);
  expect(result.limit).toBe(20);
});

test("getCampaignById returns campaign when found", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([sampleCampaign]));

  const result = await getCampaignById(1);
  expect(result).toEqual(sampleCampaign);
});

test("getCampaignById returns null when not found", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([]));

  const result = await getCampaignById(999);
  expect(result).toBeNull();
});

test("createCampaign returns created campaign", async () => {
  mockDb.insert.mockReturnValueOnce({
    values: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([sampleCampaign]) as any),
        }) as any,
    ),
  });

  const result = await createCampaign({
    name: "Summer promotion",
    subject: "Summer deals",
    content: "<p>Check our summer deals</p>",
  });
  expect(result).toEqual(sampleCampaign);
});

test("updateCampaign returns updated campaign", async () => {
  const updated = { ...sampleCampaign, status: "scheduled" as const };
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(
      () =>
        ({
          where: vi.fn(
            () =>
              ({
                returning: vi.fn(() => Promise.resolve([updated]) as any),
              }) as any,
          ),
        }) as any,
    ),
  });

  const result = await updateCampaign(1, { status: "scheduled" });
  expect(result?.status).toBe("scheduled");
});

test("updateCampaign returns null when not found", async () => {
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(
      () =>
        ({
          where: vi.fn(
            () =>
              ({
                returning: vi.fn(() => Promise.resolve([]) as any),
              }) as any,
          ),
        }) as any,
    ),
  });

  const result = await updateCampaign(999, { status: "scheduled" });
  expect(result).toBeNull();
});

test("sendCampaign updates status to sent", async () => {
  const sentCampaign = {
    ...sampleCampaign,
    status: "sent",
    sentAt: new Date(),
  };
  mockDb.select.mockReturnValueOnce(makeChain([sampleCampaign]));
  mockDb.update.mockReturnValueOnce({
    set: vi.fn(
      () =>
        ({
          where: vi.fn(
            () =>
              ({
                returning: vi.fn(() => Promise.resolve([sentCampaign]) as any),
              }) as any,
          ),
        }) as any,
    ),
  });

  const result = await sendCampaign(1);
  expect(result?.status).toBe("sent");
});

test("sendCampaign returns null when campaign not found", async () => {
  mockDb.select.mockReturnValueOnce(makeChain([]));

  const result = await sendCampaign(999);
  expect(result).toBeNull();
});

test("deleteCampaign returns true when campaign exists", async () => {
  mockDb.delete.mockReturnValueOnce({
    where: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([{ id: 1 }]) as any),
        }) as any,
    ),
  });

  const result = await deleteCampaign(1);
  expect(result).toBe(true);
});

test("deleteCampaign returns false when campaign not found", async () => {
  mockDb.delete.mockReturnValueOnce({
    where: vi.fn(
      () =>
        ({
          returning: vi.fn(() => Promise.resolve([]) as any),
        }) as any,
    ),
  });

  const result = await deleteCampaign(999);
  expect(result).toBe(false);
});
