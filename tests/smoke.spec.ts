import { expect, test } from "@playwright/test";

test("home page smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/StarCitizenOps/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Create Command Profile/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Access Mission Control/i })).toBeVisible();
});

test("login page smoke", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Mission Control Login/i })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
});

test("protected route redirects when signed out", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("organization detail renders appropriate membership view", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Email").fill("commander@starcitizenops.local");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: /Log In|Enter Command Deck/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  await page.goto("/organizations");

  const orgLinks = page.locator('a[href^="/organizations/"]');
  const count = await orgLinks.count();
  let foundOrg = false;
  let foundNonMemberOrg = false;

  for (let i = 0; i < count; i += 1) {
    const href = await orgLinks.nth(i).getAttribute("href");
    if (!href || href.endsWith("/new") || href.endsWith("/my")) continue;

    await page.goto(href, { waitUntil: "domcontentloaded" });
    foundOrg = true;
    if ((await page.getByRole("heading", { name: /Join this organization/i }).count()) > 0) {
      foundNonMemberOrg = true;
      break;
    }
  }

  expect(foundOrg).toBe(true);

  if (foundNonMemberOrg) {
    await expect(page.getByRole("heading", { name: /Organization Bio/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Join this organization/i })).toBeVisible();
    const joinButton = page.getByRole("button", { name: /Submit application|Request to join/i });
    const pendingNotice = page.getByText(/Your join request is pending leadership review\./i);
    if ((await joinButton.count()) > 0) {
      await expect(joinButton).toBeVisible();
    } else {
      await expect(pendingNotice).toBeVisible();
    }
  } else {
    await expect(page.getByText(/Tag:/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Overview/i })).toBeVisible();
  }
});
