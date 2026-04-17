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

describe("Interactions API", () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAs("admin@hotel.com", "admin123", "10.0.0.1");
  });

  it("GET /api/interactions returns list (200 or 500 without DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions`);
    expect([200, 500]).toContain(res.status);
    if (res.ok) {
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);
      expect(typeof data.total).toBe("number");
    }
  });

  it("GET /api/interactions?guestId=1 filters by guest", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions?guestId=1`);
    expect([200, 500]).toContain(res.status);
    if (res.ok) {
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  it("POST /api/interactions returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: 1, type: "call" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/interactions returns 400 on invalid type", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ guestId: 1, type: "invalid_type" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error?.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/interactions returns 400 on missing guestId", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ type: "call" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/interactions creates interaction (201 or 500 without DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({
        guestId: 1,
        type: "call",
        subject: "Follow up",
        content: "Called to confirm reservation",
      }),
    });
    expect([201, 500]).toContain(res.status);
    if (res.status === 201) {
      const data = await res.json();
      expect(data.data?.id).toBeDefined();
      expect(data.data?.type).toBe("call");
    }
  });

  it("GET /api/interactions/999999 returns 404 or 500 (depends on DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions/999999`);
    expect([404, 500]).toContain(res.status);
  });

  it("DELETE /api/interactions/1 returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions/1`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/interactions/999999 returns 404 or 500 (depends on DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/interactions/999999`, {
      method: "DELETE",
      headers: { Cookie: `token=${token}` },
    });
    expect([404, 500]).toContain(res.status);
  });

  it("receptionist cannot delete interactions", async () => {
    const receptionToken = await loginAs("reception@hotel.com", "reception123", "10.0.0.2");

    const res = await fetch(`${BASE_URL}/api/interactions/1`, {
      method: "DELETE",
      headers: { Cookie: `token=${receptionToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("marketing cannot access interactions (no permission)", async () => {
    const marketingToken = await loginAs("marketing@hotel.com", "marketing123", "10.0.0.3");

    const res = await fetch(`${BASE_URL}/api/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${marketingToken}`,
      },
      body: JSON.stringify({ guestId: 1, type: "call" }),
    });
    expect(res.status).toBe(403);
  });
});
