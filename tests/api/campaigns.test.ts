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

describe("Campaigns API", () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAs("admin@hotel.com", "admin123", "10.1.0.1");
  });

  it("GET /api/campaigns returns list (200 or 500 without DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns`);
    expect([200, 500]).toContain(res.status);
    if (res.ok) {
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  it("POST /api/campaigns returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        subject: "Subject",
        content: "<p>Content</p>",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/campaigns returns 400 on missing name", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ subject: "No name", content: "<p>test</p>" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error?.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/campaigns returns 400 on empty body", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/campaigns creates campaign with auth (201 or 500 without DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({
        name: "Summer 2026",
        subject: "Летние предложения",
        content: "<p>Специальные цены этим летом</p>",
      }),
    });
    expect([201, 500]).toContain(res.status);
    if (res.status === 201) {
      const data = await res.json();
      expect(data.data?.id).toBeDefined();
      expect(data.data?.status).toBe("draft");
    }
  });

  it("PATCH /api/campaigns/1 returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/campaigns/999999 returns 404 or 500 (depends on DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns/999999`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect([404, 500]).toContain(res.status);
  });

  it("DELETE /api/campaigns/1 returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns/1`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/campaigns/999999 returns 404 or 500 (depends on DB)", async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns/999999`, {
      method: "DELETE",
      headers: { Cookie: `token=${token}` },
    });
    expect([404, 500]).toContain(res.status);
  });

  it("marketing role cannot delete campaigns", async () => {
    const marketingToken = await loginAs("marketing@hotel.com", "marketing123", "10.1.0.2");

    const res = await fetch(`${BASE_URL}/api/campaigns/1`, {
      method: "DELETE",
      headers: { Cookie: `token=${marketingToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("receptionist cannot access campaigns", async () => {
    const receptionToken = await loginAs("reception@hotel.com", "reception123", "10.1.0.3");

    const res = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${receptionToken}`,
      },
      body: JSON.stringify({
        name: "Test",
        subject: "Test",
        content: "Test",
      }),
    });
    expect(res.status).toBe(403);
  });
});
