import { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();

  // Handle onboarding redirect for first-time users
  await page.waitForURL(/(dashboard|onboarding)/, { timeout: 10_000 });

  if (page.url().includes("/onboarding")) {
    await page.getByRole("button", { name: "Пропустить" }).click();
    await page.waitForURL(/dashboard/, { timeout: 10_000 });
  }
}
