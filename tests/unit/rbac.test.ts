import { test, expect, describe } from "vitest";
import {
  hasPermission,
  canDelete,
  canSeeFinancials,
  canSendCampaigns,
  isHigherRole,
  PERMISSIONS,
} from "@/auth/rbac";

// ── hasPermission ─────────────────────────────────────────────────────────────

describe("admin", () => {
  test("can do everything on every resource", () => {
    const resources = Object.keys(PERMISSIONS.admin) as Array<keyof typeof PERMISSIONS.admin>;
    for (const resource of resources) {
      expect(hasPermission("admin", resource, "create")).toBe(true);
      expect(hasPermission("admin", resource, "read")).toBe(true);
      expect(hasPermission("admin", resource, "update")).toBe(true);
      expect(hasPermission("admin", resource, "delete")).toBe(true);
    }
  });
});

describe("manager", () => {
  test("can read and update guests", () => {
    expect(hasPermission("manager", "guests", "read")).toBe(true);
    expect(hasPermission("manager", "guests", "update")).toBe(true);
  });

  test("cannot delete guests", () => {
    expect(hasPermission("manager", "guests", "delete")).toBe(false);
  });

  test("cannot delete bookings", () => {
    expect(hasPermission("manager", "bookings", "delete")).toBe(false);
  });

  test("cannot manage users", () => {
    expect(hasPermission("manager", "users", "create")).toBe(false);
    expect(hasPermission("manager", "users", "update")).toBe(false);
    expect(hasPermission("manager", "users", "delete")).toBe(false);
  });
});

describe("marketing", () => {
  test("can CRUD campaigns", () => {
    expect(hasPermission("marketing", "campaigns", "create")).toBe(true);
    expect(hasPermission("marketing", "campaigns", "read")).toBe(true);
    expect(hasPermission("marketing", "campaigns", "update")).toBe(true);
    expect(hasPermission("marketing", "campaigns", "delete")).toBe(true);
  });

  test("cannot create or delete bookings", () => {
    expect(hasPermission("marketing", "bookings", "create")).toBe(false);
    expect(hasPermission("marketing", "bookings", "delete")).toBe(false);
  });

  test("can only read users, not mutate", () => {
    expect(hasPermission("marketing", "users", "read")).toBe(true);
    expect(hasPermission("marketing", "users", "create")).toBe(false);
    expect(hasPermission("marketing", "users", "update")).toBe(false);
    expect(hasPermission("marketing", "users", "delete")).toBe(false);
  });
});

describe("receptionist", () => {
  test("can create and read bookings", () => {
    expect(hasPermission("receptionist", "bookings", "create")).toBe(true);
    expect(hasPermission("receptionist", "bookings", "read")).toBe(true);
  });

  test("cannot delete anything", () => {
    const resources = ["guests", "bookings", "interactions", "campaigns"] as const;
    for (const r of resources) {
      expect(hasPermission("receptionist", r, "delete")).toBe(false);
    }
  });

  test("cannot access reports", () => {
    expect(hasPermission("receptionist", "reports", "read")).toBe(false);
  });

  test("cannot send campaigns", () => {
    expect(hasPermission("receptionist", "campaigns", "create")).toBe(false);
  });
});

// ── canDelete ─────────────────────────────────────────────────────────────────

test("only admin canDelete", () => {
  expect(canDelete("admin")).toBe(true);
  expect(canDelete("manager")).toBe(false);
  expect(canDelete("marketing")).toBe(false);
  expect(canDelete("receptionist")).toBe(false);
});

// ── canSeeFinancials ──────────────────────────────────────────────────────────

test("admin and manager canSeeFinancials", () => {
  expect(canSeeFinancials("admin")).toBe(true);
  expect(canSeeFinancials("manager")).toBe(true);
  expect(canSeeFinancials("marketing")).toBe(false);
  expect(canSeeFinancials("receptionist")).toBe(false);
});

// ── canSendCampaigns ──────────────────────────────────────────────────────────

test("admin, manager, marketing canSendCampaigns", () => {
  expect(canSendCampaigns("admin")).toBe(true);
  expect(canSendCampaigns("manager")).toBe(true);
  expect(canSendCampaigns("marketing")).toBe(true);
  expect(canSendCampaigns("receptionist")).toBe(false);
});

// ── isHigherRole ──────────────────────────────────────────────────────────────

test("isHigherRole: admin > manager > marketing > receptionist", () => {
  expect(isHigherRole("admin", "manager")).toBe(true);
  expect(isHigherRole("manager", "marketing")).toBe(true);
  expect(isHigherRole("marketing", "receptionist")).toBe(true);
  expect(isHigherRole("receptionist", "admin")).toBe(false);
  expect(isHigherRole("manager", "manager")).toBe(false);
});
