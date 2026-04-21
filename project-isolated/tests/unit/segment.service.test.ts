import { test, expect, beforeEach } from "vitest";
import {
  getAllSegments,
  getSegmentById,
  createSegment,
  deleteSegment,
} from "@/services/segment.service";

beforeEach(() => {});

test("getAllSegments returns all segments", async () => {
  const result = await getAllSegments();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
  expect(result[0]).toHaveProperty("id");
  expect(result[0]).toHaveProperty("name");
});

test("getSegmentById returns segment when found", async () => {
  const result = await getSegmentById(1);
  expect(result).not.toBeNull();
  expect(result?.id).toBe(1);
  expect(result?.name).toBe("VIP гости");
});

test("getSegmentById returns null when not found", async () => {
  const result = await getSegmentById(999);
  expect(result).toBeNull();
});

test("createSegment creates new segment with manual type", async () => {
  const result = await createSegment("Test segment", "manual");
  expect(result.name).toBe("Test segment");
  expect(result.type).toBe("manual");
  expect(result.guestCount).toBe(0);
});

test("createSegment creates new segment with auto type and criteria", async () => {
  const criteria = { minVisits: 2 };
  const result = await createSegment("Auto segment", "auto", criteria);
  expect(result.type).toBe("auto");
  expect(result.criteria).toEqual(criteria);
});

test("createSegment creates new segment with default type", async () => {
  const result = await createSegment("Default segment");
  expect(result.type).toBe("manual");
});

test("deleteSegment returns true when segment exists", async () => {
  const result = await deleteSegment(1);
  expect(result).toBe(true);
});

test("deleteSegment returns false when segment not found", async () => {
  await deleteSegment(1);
  const result = await deleteSegment(999);
  expect(result).toBe(false);
});
