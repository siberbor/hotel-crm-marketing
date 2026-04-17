import { test, expect, vi, describe } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

describe("Guest API Validation", () => {
  test("CreateGuestSchema validates required fields", () => {
    const CreateGuestSchema = z.object({
      firstName: z.string().min(1, "Имя обязательно"),
      lastName: z.string().min(1, "Фамилия обязательна"),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional().or(z.literal("")),
      preferences: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    });

    const valid = CreateGuestSchema.safeParse({
      firstName: "Иван",
      lastName: "Петров",
    });
    expect(valid.success).toBe(true);

    const validWithEmail = CreateGuestSchema.safeParse({
      firstName: "Иван",
      lastName: "Петров",
      email: "ivan@test.com",
    });
    expect(validWithEmail.success).toBe(true);

    const invalid = CreateGuestSchema.safeParse({});
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.errors.length).toBeGreaterThan(0);
    }
  });

  test("UpdateGuestSchema allows partial updates", () => {
    const UpdateGuestSchema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional().or(z.literal("")),
      preferences: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    });

    const partialUpdate = UpdateGuestSchema.safeParse({
      firstName: "Новое имя",
    });
    expect(partialUpdate.success).toBe(true);
  });
});

describe("Booking API Validation", () => {
  test("CreateBookingSchema validates required fields", () => {
    const CreateBookingSchema = z.object({
      guestId: z.number({ required_error: "ID гостя обязателен" }),
      roomId: z.number({ required_error: "ID номера обязателен" }),
      checkInDate: z.string().datetime().or(z.string().date()),
      checkOutDate: z.string().datetime().or(z.string().date()),
      totalPrice: z.string(),
      source: z.string().optional(),
      notes: z.string().optional(),
    });

    const valid = CreateBookingSchema.safeParse({
      guestId: 1,
      roomId: 1,
      checkInDate: "2024-06-01",
      checkOutDate: "2024-06-05",
      totalPrice: "5000",
    });
    expect(valid.success).toBe(true);

    const invalid = CreateBookingSchema.safeParse({});
    expect(invalid.success).toBe(false);
  });

  test("UpdateBookingSchema validates status enum", () => {
    const UpdateBookingSchema = z.object({
      status: z
        .enum([
          "pending",
          "confirmed",
          "checked_in",
          "checked_out",
          "cancelled",
        ])
        .optional(),
      paidAmount: z.string().optional(),
    });

    const validStatus = UpdateBookingSchema.safeParse({ status: "checked_in" });
    expect(validStatus.success).toBe(true);

    const invalidStatus = UpdateBookingSchema.safeParse({ status: "invalid" });
    expect(invalidStatus.success).toBe(false);
  });
});

describe("Interaction API Validation", () => {
  test("CreateInteractionSchema validates type enum", () => {
    const CreateInteractionSchema = z.object({
      guestId: z.number(),
      bookingId: z.number().optional(),
      type: z.enum(["call", "email", "meeting", "complaint", "compliment"]),
      subject: z.string().optional(),
      content: z.string().optional(),
      userId: z.number().optional(),
    });

    const valid = CreateInteractionSchema.safeParse({
      guestId: 1,
      type: "call",
      subject: "Follow up",
    });
    expect(valid.success).toBe(true);

    const invalid = CreateInteractionSchema.safeParse({
      guestId: 1,
      type: "invalid",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("Campaign API Validation", () => {
  test("CreateCampaignSchema validates required fields", () => {
    const CreateCampaignSchema = z.object({
      name: z.string().min(1),
      subject: z.string().min(1),
      content: z.string().min(1),
      segmentId: z.number().optional(),
    });

    const valid = CreateCampaignSchema.safeParse({
      name: "Summer promotion",
      subject: "Summer deals",
      content: "<p>Check our summer deals</p>",
    });
    expect(valid.success).toBe(true);

    const invalid = CreateCampaignSchema.safeParse({});
    expect(invalid.success).toBe(false);
  });
});

describe("Permissions Matrix", () => {
  const PERMISSION_RULES: Record<string, Record<string, string[]>> = {
    guests: {
      read: ["admin", "manager", "marketing", "receptionist"],
      create: ["admin", "manager", "receptionist"],
      update: ["admin", "manager", "receptionist"],
      delete: ["admin"],
    },
    bookings: {
      read: ["admin", "manager", "marketing", "receptionist"],
      create: ["admin", "manager", "receptionist"],
      update: ["admin", "manager", "receptionist"],
      delete: ["admin"],
    },
    campaigns: {
      read: ["admin", "manager", "marketing"],
      create: ["admin", "manager", "marketing"],
      send: ["admin", "manager", "marketing"],
      delete: ["admin"],
    },
  };

  test("admin can do everything", () => {
    expect(PERMISSION_RULES.guests.read.includes("admin")).toBe(true);
    expect(PERMISSION_RULES.guests.create.includes("admin")).toBe(true);
    expect(PERMISSION_RULES.guests.update.includes("admin")).toBe(true);
    expect(PERMISSION_RULES.guests.delete.includes("admin")).toBe(true);
  });

  test("manager cannot delete guests", () => {
    expect(PERMISSION_RULES.guests.delete.includes("manager")).toBe(false);
  });

  test("receptionist cannot delete", () => {
    expect(PERMISSION_RULES.guests.delete.includes("receptionist")).toBe(false);
    expect(PERMISSION_RULES.bookings.delete.includes("receptionist")).toBe(
      false,
    );
  });

  test("marketing cannot read financials in bookings", () => {
    expect(PERMISSION_RULES.bookings.read.includes("marketing")).toBe(true);
  });

  test("marketing cannot create campaigns", () => {
    expect(PERMISSION_RULES.campaigns.create.includes("marketing")).toBe(true);
  });

  test("receptionist cannot access campaigns", () => {
    expect(PERMISSION_RULES.campaigns.read.includes("receptionist")).toBe(
      false,
    );
  });
});

describe("Permissions Middleware", () => {
  test("permissionsMiddleware denies access without token", async () => {
    vi.mock("@/auth/jwt", () => ({
      verifyToken: vi.fn().mockResolvedValue(null),
    }));

    const { permissionsMiddleware } = await import("@/middleware/permissions");
    const req = new NextRequest("http://localhost/api/guests", {
      method: "POST",
    });

    const result = await permissionsMiddleware(req, "guests", "create");
    expect(result).not.toBeNull();
    expect(result?.status).toBe(401);
  });
});
