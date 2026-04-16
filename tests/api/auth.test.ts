import { describe, it, expect, beforeAll, afterAll } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Auth API", () => {
  const testUser = {
    email: "admin@hotel.com",
    password: "admin123",
  };

  let token: string;

  it("should login successfully", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data?.token).toBeDefined();
    token = data.data.token;
  });

  it("should get current user", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `token=${token}` },
    });

    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data?.user).toBeDefined();
  });

  it("should reject invalid credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "wrong@test.com", password: "wrong" }),
    });

    expect(res.status).toBe(401);
  });
});
