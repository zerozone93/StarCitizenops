import { expect, test, type Page } from "@playwright/test";

async function loginAsCommander(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Email").fill("commander@starcitizenops.local");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: /Log In|Enter Command Deck/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

async function findOrgUrlByMembership(page: Page, wantNonMember: boolean) {
  await page.goto("/organizations", { waitUntil: "domcontentloaded" });
  const hrefs = await page
    .locator('a[href^="/organizations/"]')
    .evaluateAll((links) =>
      links
        .map((link) => (link as HTMLAnchorElement).getAttribute("href") || "")
        .filter((href) => href && !href.endsWith("/new") && !href.endsWith("/my"))
    );

  for (const href of hrefs) {
    if (!href) continue;

    await page.goto(href, { waitUntil: "domcontentloaded" });
    const isNonMember = (await page.getByRole("heading", { name: /Join this organization/i }).count()) > 0;

    if (wantNonMember === isNonMember) {
      return href;
    }
  }

  return null;
}

async function findMemberOrgUrl(page: Page) {
  return findOrgUrlByMembership(page, false);
}

test.describe("expanded action and form coverage", () => {
  test("protected pages redirect to login when signed out", async ({ page }) => {
    const protectedPaths = ["/dashboard", "/operations/new", "/fleet/add", "/organizations/new"];

    for (const path of protectedPaths) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("dashboard quick action buttons route correctly", async ({ page }) => {
    await loginAsCommander(page);

    await page.getByRole("main").getByRole("link", { name: "Stage Operation" }).click();
    await expect(page).toHaveURL(/\/operations\/new/);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.getByRole("main").getByRole("link", { name: "AI Planner" }).click();
    await expect(page).toHaveURL(/\/ai-planner/);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.getByRole("main").getByRole("link", { name: "Find Org" }).click();
    await expect(page).toHaveURL(/\/organizations/);
  });

  test("operations board create button opens operation form", async ({ page }) => {
    await loginAsCommander(page);

    await page.goto("/operations", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Create operation" }).click();
    await expect(page).toHaveURL(/\/operations\/new/);
    await expect(page.getByRole("button", { name: "Create operation" })).toBeVisible();
  });

  test("new operation form pre-populates org and submits successfully", async ({ page }) => {
    await loginAsCommander(page);

    const opSuffix = Date.now();
    await page.goto(`/operations/new?ai_title=Coverage%20Op%20${opSuffix}&ai_startTime=2026-07-15T20:00`, {
      waitUntil: "domcontentloaded",
    });

    const orgSelect = page.locator('select[name="organizationId"]');
    await expect(orgSelect).toBeVisible();

    const selectedOrgId = await orgSelect.inputValue();
    expect(selectedOrgId).not.toBe("");

    const optionValues = await page.locator('select[name="organizationId"] option').evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value)
    );
    expect(optionValues.length).toBeGreaterThan(0);
    expect(optionValues.every((value) => value.trim().length > 0)).toBe(true);

    await page.getByRole("button", { name: "Create operation" }).click();
    await expect(page).toHaveURL(/\/operations\/[a-z0-9]+/i, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: `Coverage Op ${opSuffix}` })).toBeVisible();
  });

  test("non-member organization join application submit path works", async ({ page }) => {
    await loginAsCommander(page);

    const nonMemberOrgUrl = await findOrgUrlByMembership(page, true);
    test.skip(!nonMemberOrgUrl, "No non-member organization available to test join application flow.");

    await page.goto(nonMemberOrgUrl!, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Join this organization/i })).toBeVisible();

    const pendingMessage = page.getByText(/Your join request is pending leadership review\./i);
    if ((await pendingMessage.count()) > 0) {
      await expect(pendingMessage).toBeVisible();
      return;
    }

    await page.getByPlaceholder("Your in-game handle").fill("CoveragePilot");
    await page.getByPlaceholder("Pilot, logistics, medic, security...").fill("Escort Pilot");
    await page.getByPlaceholder("Example: 3-4 evenings/week, UTC-5").fill("Most weeknights");
    await page.getByPlaceholder("Short answer").fill("I can support org convoy and extraction operations weekly.");
    await page.getByPlaceholder(/Anything else leadership should know\?/i).fill("Playwright coverage test submission.");

    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByText(/Your join request is pending leadership review\./i)).toBeVisible({ timeout: 15_000 });
  });

  test("add fleet asset form submits and redirects with message", async ({ page }) => {
    await loginAsCommander(page);

    await page.goto("/fleet/add", { waitUntil: "domcontentloaded" });

    await page.getByRole("checkbox", { name: /Custom asset entry/i }).check();
    await page.locator('input[name="name"]').fill(`Coverage Ship ${Date.now()}`);
    await page.locator('input[name="manufacturer"]').fill("Aegis");
    await page.locator('select[name="role"]').selectOption({ index: 1 });
    await page.locator('select[name="size"]').selectOption({ index: 1 });
    await page.locator('input[name="quantity"]').fill("1");

    await page.getByRole("button", { name: "Add to Fleet" }).click();
    await expect(page).toHaveURL(/\/fleet\?message=/, { timeout: 20_000 });
    await expect(page.getByText(/added|updated/i)).toBeVisible();
  });

  test("member organization admin links route correctly", async ({ page }) => {
    await loginAsCommander(page);

    const memberOrgUrl = await findMemberOrgUrl(page);
    test.skip(!memberOrgUrl, "No member organization available to test member actions.");

    await page.goto(memberOrgUrl!, { waitUntil: "domcontentloaded" });

    await page.getByRole("link", { name: "Member privileges" }).click();
    await expect(page).toHaveURL(/\/organizations\/[a-z0-9]+\/members-privileges/i);

    await page.goto(memberOrgUrl!, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Edit organization" }).click();
    await expect(page).toHaveURL(/\/organizations\/[a-z0-9]+\/edit/i);
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  test("member organization forum post submit path works", async ({ page }) => {
    await loginAsCommander(page);

    const memberOrgUrl = await findMemberOrgUrl(page);
    test.skip(!memberOrgUrl, "No member organization available to test forum posting.");

    await page.goto(memberOrgUrl!, { waitUntil: "domcontentloaded" });

    const postTitle = `Coverage Forum Post ${Date.now()}`;
    const forumForm = page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Post to Organization Forum" }) })
      .first();
    await forumForm.locator('input[name="title"]').fill(postTitle);
    await forumForm.locator('textarea[name="body"]').fill("Forum coverage submission from Playwright.");
    await forumForm.locator('input[name="agreedToGuidelines"]').check();

    await page.getByRole("button", { name: "Post to Organization Forum" }).click();
    await expect(page.getByRole("heading", { name: postTitle })).toBeVisible({ timeout: 20_000 });
  });

  test("member organization bulletin submit path works", async ({ page }) => {
    await loginAsCommander(page);

    const memberOrgUrl = await findMemberOrgUrl(page);
    test.skip(!memberOrgUrl, "No member organization available to test bulletin posting.");

    await page.goto(memberOrgUrl!, { waitUntil: "domcontentloaded" });

    const bulletinTitle = `Coverage Bulletin ${Date.now()}`;
    const bulletinForm = page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Post bulletin" }) })
      .first();
    await bulletinForm.locator('input[name="title"]').fill(bulletinTitle);
    await bulletinForm.locator('textarea[name="body"]').fill("Bulletin coverage submission from Playwright.");

    await page.getByRole("button", { name: "Post bulletin" }).click();
    const bulletinPanel = page.locator("article").filter({ has: page.getByRole("heading", { name: "Organization bulletins" }) }).first();
    await expect(bulletinPanel.getByText(bulletinTitle).first()).toBeVisible({ timeout: 20_000 });
  });
});
