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

describe("Guests API", () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAs("admin@hotel.com", "admin123", "10.3.0.1");
  });

  it("should get guests list", async () => {
    const res = await fetch(`${BASE_URL}/api/guests`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("should search guests", async () => {
    const res = await fetch(`${BASE_URL}/api/guests?search=Александр`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data).toBeDefined();
  });

  it("should return 401 without auth on create", async () => {
    const res = await fetch(`${BASE_URL}/api/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Тест", lastName: "Тестов" }),
    });
    expect(res.status).toBe(401);
  });

  it("should create guest with auth", async () => {
    const res = await fetch(`${BASE_URL}/api/guests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({
        firstName: "Тест",
        lastName: "Тестов",
        email: "test@test.com",
        phone: "+79990000000",
      }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data?.id).toBeDefined();
  });
});
