import { chromium } from "playwright";
import type { BrowserContext, Page } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT_DIR = path.join(process.cwd(), "public/assets/user-guide");

async function ensureOutDir() {
  await fs.mkdir(OUT_DIR, { recursive: true });
}

async function screenshot(page: Page, name: string) {
  const filePath = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false, timeout: 120000 });
  console.log(`Saved ${filePath}`);
}

async function login(context: BrowserContext, page: Page) {
  const candidates = [
    { email: "guide.user@starcitizenops.local", password: "GuidePass123!" },
    { email: "commander@starcitizenops.local", password: "password123" },
    { email: "zerozone2@live.com", password: "zerozone93" },
  ];

  for (const account of candidates) {
    const csrfRes = await context.request.get(`${BASE_URL}/api/auth/csrf`);
    if (!csrfRes.ok()) continue;
    const csrfData = (await csrfRes.json()) as { csrfToken?: string };
    const csrfToken = csrfData.csrfToken;
    if (!csrfToken) continue;

    const callbackRes = await context.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        csrfToken,
        email: account.email,
        password: account.password,
        callbackUrl: `${BASE_URL}/dashboard`,
      },
      failOnStatusCode: false,
    });

    if (!(callbackRes.status() === 302 || callbackRes.status() === 200)) {
      continue;
    }

    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
      if (/\/dashboard/.test(page.url())) return;
    } catch {
      // Try next seeded credential pair
    }
  }

  const unique = Date.now().toString().slice(-6);
  const email = `guide${unique}@starcitizenops.local`;
  const password = "GuidePass123!";

  await page.goto(`${BASE_URL}/register`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="name"]').fill("Guide Tester");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  // Keep default "join" intent and select the first available organization.
  await page.waitForSelector('select[name="joinOrganizationId"] option[value]:not([value=""])', {
    timeout: 30000,
  });
  const optionValue = await page
    .locator('select[name="joinOrganizationId"] option[value]:not([value=""])')
    .first()
    .getAttribute("value");
  if (!optionValue) {
    throw new Error("No organization options available for registration fallback.");
  }
  await page.locator('select[name="joinOrganizationId"]').selectOption(optionValue);

  await page.getByRole("button", { name: /Create Profile/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

async function captureLeaderOrgPage(page: Page) {
  await page.goto(`${BASE_URL}/organizations`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const orgLinks = page.locator('a[href^="/organizations/"]');
  const count = await orgLinks.count();
  for (let i = 0; i < count; i += 1) {
    const href = await orgLinks.nth(i).getAttribute("href");
    if (!href || href.includes("/new") || href.includes("/my")) continue;
    await page.goto(`${BASE_URL}${href}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const hasEditor = await page.getByRole("heading", { name: /Application Questions/i }).count();
    if (hasEditor > 0) {
      await screenshot(page, "org-application-question-editor");
      return true;
    }
  }

  return false;
}

async function capturePublicJoinForm(page: Page) {
  await page.goto(`${BASE_URL}/organizations`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const atlasLink = page.getByRole("link", { name: /Atlas Freight Group \[ATFG\]/i });
  if ((await atlasLink.count()) > 0) {
    await atlasLink.click();
    await page.waitForLoadState("domcontentloaded");
  } else {
    const orgLinks = page.locator('a[href^="/organizations/"]');
    const count = await orgLinks.count();
    for (let i = 0; i < count; i += 1) {
      const href = await orgLinks.nth(i).getAttribute("href");
      if (!href || href.includes("/new") || href.includes("/my")) continue;
      await page.goto(`${BASE_URL}${href}`, { waitUntil: "domcontentloaded" });
      if ((await page.getByRole("heading", { name: /Join this organization/i }).count()) > 0) break;
    }
  }

  await page.waitForTimeout(800);
  await screenshot(page, "org-join-application-form");
}

async function main() {
  await ensureOutDir();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1536, height: 960 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await screenshot(page, "home");

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await screenshot(page, "login");

  await login(context, page);
  await screenshot(page, "dashboard");
  await page.close();

  const openAndShot = async (route: string, file: string) => {
    const p = await context.newPage();
    await p.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(800);
    await screenshot(p, file);
    await p.close();
  };

  await openAndShot("/operations", "operations-list");
  await openAndShot("/operations/new", "create-operation");
  await openAndShot("/missions", "missions-library");
  await openAndShot("/organizations", "organizations-list");

  const joinPage = await context.newPage();
  await capturePublicJoinForm(joinPage);
  await joinPage.close();

  const leaderPage = await context.newPage();
  await captureLeaderOrgPage(leaderPage);
  await leaderPage.close();

  await openAndShot("/settings", "settings");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
