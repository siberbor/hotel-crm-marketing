import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Guests API", () => {
  it("should get guests list", async () => {
    const res = await fetch(`${BASE_URL}/api/guests`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("should search guests", async () => {
    const res = await fetch(`${BASE_URL}/api/guests?search=Иван`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data).toBeDefined();
  });

  it("should create guest", async () => {
    const newGuest = {
      firstName: "Тест",
      lastName: "Тестов",
      email: "test@test.com",
      phone: "+79990000000",
    };

    const res = await fetch(`${BASE_URL}/api/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGuest),
    });

    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.data?.id).toBeDefined();
  });
});
