import { chromium, firefox, webkit } from "playwright";
import type { BrowserContext } from "playwright";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3001";
const ROUTE = process.env.ROUTE || "/dashboard";
const NAME = process.env.NAME || "shot";
const BROWSER = process.env.BROWSER || "firefox";

async function login(context: BrowserContext) {
  const accounts = [
    { email: "guide.user@starcitizenops.local", password: "GuidePass123!" },
    { email: "commander@starcitizenops.local", password: "password123" },
    { email: "zerozone2@live.com", password: "zerozone93" },
  ];

  for (const account of accounts) {
    const csrfRes = await context.request.get(`${BASE_URL}/api/auth/csrf`);
    if (!csrfRes.ok()) continue;
    const csrfData = (await csrfRes.json()) as { csrfToken?: string };
    if (!csrfData.csrfToken) continue;

    const callbackRes = await context.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        csrfToken: csrfData.csrfToken,
        email: account.email,
        password: account.password,
        callbackUrl: `${BASE_URL}/dashboard`,
      },
      failOnStatusCode: false,
    });

    if (callbackRes.status() !== 302 && callbackRes.status() !== 200) continue;

    const sessionRes = await context.request.get(`${BASE_URL}/api/auth/session`);
    if (!sessionRes.ok()) continue;
    const session = (await sessionRes.json()) as { user?: { email?: string } };
    if (session?.user?.email) return true;
  }

  return false;
}

async function main() {
  const browserType = BROWSER === "chromium" ? chromium : BROWSER === "webkit" ? webkit : firefox;
  const browser = await browserType.launch({
    headless: true,
    args: BROWSER === "chromium" ? ["--disable-dev-shm-usage", "--no-sandbox"] : [],
  });
  const context = await browser.newContext({ viewport: { width: 1536, height: 960 } });
  const page = await context.newPage();

  const ok = await login(context);
  if (!ok) throw new Error("Unable to authenticate for screenshot");

  await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const outPath = path.join(process.cwd(), "public/assets/user-guide", `${NAME}.png`);
  await page.screenshot({ path: outPath, fullPage: false, timeout: 120000 });
  console.log(`Saved ${outPath}`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
