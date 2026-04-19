import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Guests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin@hotel.com", "admin123");
    await page.goto("/guests");
    await page.waitForLoadState("networkidle");
  });

  test("create new guest", async ({ page }) => {
    await page.getByRole("button", { name: /Добавить/ }).first().click();

    const modal = page.locator('[role="dialog"]').or(page.locator(".modal, [class*=modal]")).first();

    await page.getByLabel("Имя").fill("Тестовый");
    await page.getByLabel("Фамилия").fill("Гость");
    await page.getByLabel("Email").last().fill("e2e.test@hotel.com");
    await page.getByLabel("Телефон").fill("+7 900 000-00-00");

    await page.getByRole("button", { name: "Добавить" }).last().click();

    await expect(page.getByText("Тестовый")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Гость")).toBeVisible({ timeout: 5_000 });
  });

  test("search guests filters list", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Поиск/);
    await searchInput.fill("Иван");

    await page.waitForTimeout(400); // debounce 300ms
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(1, { timeout: 5_000 });
  });
});
