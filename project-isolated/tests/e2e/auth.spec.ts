import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@hotel.com");
    await page.getByLabel("Пароль").fill("admin123");
    await page.getByRole("button", { name: "Войти" }).click();

    await page.waitForURL(/(dashboard|onboarding)/, { timeout: 10_000 });
    expect(page.url()).toMatch(/(dashboard|onboarding)/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@hotel.com");
    await page.getByLabel("Пароль").fill("wrongpassword");
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page.locator("text=Ошибка")).toBeVisible({ timeout: 5_000 });
  });

  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
