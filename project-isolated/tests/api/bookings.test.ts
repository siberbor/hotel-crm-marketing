import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function loginAs(email: string, password: string, ip = "127.0.0.1"): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.data?.token ?? "";
}

describe("Bookings API", () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAs("admin@hotel.com", "admin123", "10.2.0.1");
  });

  it("GET /api/bookings returns list", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.data)).toBe(true);
    expect(typeof data.total).toBe("number");
    expect(typeof data.page).toBe("number");
  });

  it("GET /api/bookings?status=active returns list", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?status=active`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("GET /api/bookings?guestId=1 filters by guest", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?guestId=1`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("GET /api/bookings/1 returns demo booking", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/1`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data?.id).toBe(1);
  });

  it("GET /api/bookings/999999 returns 404", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/999999`);
    expect(res.status).toBe(404);
  });

  it("POST /api/bookings returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId: 1,
        roomId: 1,
        checkInDate: "2026-06-01",
        checkOutDate: "2026-06-05",
        totalPrice: "14000",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/bookings returns 400 on invalid data", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error?.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/bookings creates booking with auth", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({
        guestId: 1,
        roomId: 1,
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-05",
        totalPrice: "14000",
        source: "direct",
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data?.id).toBeDefined();
    expect(data.data?.status).toBe("pending");
  });

  it("PATCH /api/bookings/2 returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/bookings/2 returns 400 on invalid status", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/2`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ status: "invalid_status" }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/bookings/3 updates status to confirmed", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/3`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ status: "confirmed" }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data?.status).toBe("confirmed");
  });

  it("DELETE /api/bookings/1 returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/1`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/bookings/999999 returns 404", async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/999999`, {
      method: "DELETE",
      headers: { Cookie: `token=${token}` },
    });
    expect(res.status).toBe(404);
  });
});
