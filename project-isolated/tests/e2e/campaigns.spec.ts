import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Campaigns", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin@hotel.com", "admin123");
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");
  });

  test("create new campaign", async ({ page }) => {
    await page.getByRole("button", { name: /Новая кампания/ }).click();

    await page.getByLabel("Название").fill("E2E Тест Кампания");
    await page.getByLabel("Тема письма").fill("Тестовая тема E2E");
    await page.getByLabel("Содержание").fill("Тестовый текст E2E кампании");

    await page.getByRole("button", { name: "Добавить" }).last().click();

    await expect(page.getByText("E2E Тест Кампания")).toBeVisible({ timeout: 5_000 });
  });

  test("send draft campaign", async ({ page }) => {
    // Create a draft campaign first via API to ensure clean state
    await page.request.post("/api/campaigns", {
      data: {
        name: "E2E Отправка Кампании",
        subject: "Тема для отправки",
        content: "Контент для отправки",
      },
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const sendButton = page
      .getByRole("row")
      .filter({ hasText: "E2E Отправка Кампании" })
      .getByRole("button", { name: "Отправить" });

    await sendButton.click();

    await expect(
      page
        .getByRole("row")
        .filter({ hasText: "E2E Отправка Кампании" })
        .getByText(/Отправляется|Отправлена/)
    ).toBeVisible({ timeout: 5_000 });
  });
});
