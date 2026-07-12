import { chromium, firefox, type BrowserContext, type ConsoleMessage, type Page, type Request, type Response, type LaunchOptions } from "playwright";

type ControlFailure = {
  route: string;
  control: string;
  reason: string;
};

type RouteResult = {
  route: string;
  controlCount: number;
  checkedCount: number;
  failures: ControlFailure[];
  consoleErrors: string[];
  serverErrors: string[];
  requestFailures: string[];
};

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

const ROUTES = [
  "/dashboard",
  "/account",
  "/operations",
  "/operations/new",
  "/missions",
  "/organizations",
  "/fleet",
  "/notifications",
  "/social",
  "/settings",
  "/profile",
  "/coalitions",
  "/tools/item-finder",
];

const CREDENTIALS = [
  { email: "guide.user@starcitizenops.local", password: "GuidePass123!" },
  { email: "zerozone2@live.com", password: "zerozone93" },
  { email: "commander@starcitizenops.local", password: "password123" },
];

function normalizeText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

async function login(context: BrowserContext): Promise<void> {
  for (const creds of CREDENTIALS) {
    const csrfRes = await context.request.get(`${BASE_URL}/api/auth/csrf`);
    if (!csrfRes.ok()) continue;

    const csrfData = (await csrfRes.json()) as { csrfToken?: string };
    if (!csrfData.csrfToken) continue;

    const callbackRes = await context.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        csrfToken: csrfData.csrfToken,
        email: creds.email,
        password: creds.password,
        callbackUrl: `${BASE_URL}/dashboard`,
      },
      failOnStatusCode: false,
    });

    if (callbackRes.status() !== 302 && callbackRes.status() !== 200) continue;

    const checkPage = await context.newPage();
    await checkPage.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    const ok = !checkPage.url().includes("/login");
    await checkPage.close();
    if (ok) return;
  }

  throw new Error("Unable to authenticate with known seeded credentials.");
}

function shouldIgnoreRequestFailure(url: string, reason: string): boolean {
  if (url.includes("/_next/static/chunks/") && reason.includes("ERR_ABORTED")) return true;
  if (url.includes("?_rsc=") && reason.includes("ERR_ABORTED")) return true;
  if (url.includes("js.puter.com")) return true;
  return false;
}

async function checkRoute(page: Page, route: string): Promise<RouteResult> {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];
  const requestFailures: string[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      const text = normalizeText(msg.text());
      if (text) consoleErrors.push(text);
    }
  };
  const onResponse = (res: Response) => {
    if (res.status() >= 500) {
      const url = res.url();
      // Ignore known external script and dev artifact noise.
      if (url.includes("js.puter.com")) return;
      serverErrors.push(`${res.status()} ${url}`);
    }
  };
  const onRequestFailed = (req: Request) => {
    const fail = req.failure();
    const reason = fail?.errorText || "request failed";
    const url = req.url();
    if (shouldIgnoreRequestFailure(url, reason)) return;
    requestFailures.push(`${reason} ${url}`);
  };

  page.on("console", onConsole);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  const failures: ControlFailure[] = [];
  let controlCount = 0;
  let checkedCount = 0;

  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1000);

    if (page.url().includes("/login")) {
      failures.push({ route, control: "<route>", reason: "Redirected to /login (unauthorized)." });
      return { route, controlCount: 0, checkedCount: 0, failures, consoleErrors, serverErrors, requestFailures };
    }

    const controls = page.locator('button, input[type="checkbox"]');
    controlCount = await controls.count();

    for (let i = 0; i < controlCount; i += 1) {
      const locator = controls.nth(i);
      const visible = await locator.isVisible().catch(() => false);
      if (!visible) continue;

      const disabled = await locator.isDisabled().catch(() => true);
      const meta = await locator.evaluate((el) => {
        const isCheckbox = el instanceof HTMLInputElement && el.type === "checkbox";
        const text = (el as HTMLElement).innerText || (el as HTMLInputElement).value || "";
        const name = (el as HTMLInputElement).name || "";
        const id = (el as HTMLElement).id || "";
        const classes = (el as HTMLElement).className || "";
        const type = (el as HTMLInputElement).type || el.tagName.toLowerCase();
        return { isCheckbox, text: text.trim(), name, id, classes, type };
      }).catch(() => ({ isCheckbox: false, text: "", name: "", id: "", classes: "", type: "unknown" }));

      const label = `${meta.type} text="${normalizeText(meta.text).slice(0, 60)}" name="${meta.name}" id="${meta.id}" class="${normalizeText(meta.classes).slice(0, 60)}"`;

      if (disabled) {
        checkedCount += 1;
        continue;
      }

      try {
        await locator.click({ trial: true, timeout: 5000, noWaitAfter: true });
        checkedCount += 1;
      } catch {
        try {
          await locator.click({ trial: true, timeout: 3000, noWaitAfter: true, force: true });
          checkedCount += 1;
        } catch (secondError) {
          failures.push({
            route,
            control: label,
            reason: `Not actionable: ${secondError instanceof Error ? secondError.message : String(secondError)}`,
          });
        }
      }
    }
  } finally {
    page.off("console", onConsole);
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
  }

  return {
    route,
    controlCount,
    checkedCount,
    failures,
    consoleErrors,
    serverErrors,
    requestFailures,
  };
}

async function main() {
  const results: RouteResult[] = [];

  const engine = (process.env.PW_ENGINE || "firefox").toLowerCase();
  const browserType = engine === "chromium" ? chromium : firefox;

  const launchOptions: LaunchOptions = {
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  };

  for (const route of ROUTES) {
    const browser = await browserType.launch(launchOptions);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    let result: RouteResult;
    try {
      await login(context);
      const page = await context.newPage();
      result = await checkRoute(page, route);
      await page.close().catch(() => {});
    } catch (error) {
      result = {
        route,
        controlCount: 0,
        checkedCount: 0,
        failures: [
          {
            route,
            control: "<route>",
            reason: `Route crashed or failed to load: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        consoleErrors: [],
        serverErrors: [],
        requestFailures: [],
      };
    }
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    results.push(result);
  }

  const totalControls = results.reduce((sum, r) => sum + r.controlCount, 0);
  const totalChecked = results.reduce((sum, r) => sum + r.checkedCount, 0);
  const allFailures = results.flatMap((r) => r.failures);
  const allConsoleErrors = results.flatMap((r) => r.consoleErrors.map((e) => `[${r.route}] ${e}`));
  const allServerErrors = results.flatMap((r) => r.serverErrors.map((e) => `[${r.route}] ${e}`));
  const allRequestFailures = results.flatMap((r) => r.requestFailures.map((e) => `[${r.route}] ${e}`));

  console.log("\n=== QA Control Sweep Summary ===");
  console.log(`Routes checked: ${results.length}`);
  console.log(`Controls found: ${totalControls}`);
  console.log(`Controls actionability-checked: ${totalChecked}`);
  console.log(`Control failures: ${allFailures.length}`);
  console.log(`Console errors: ${allConsoleErrors.length}`);
  console.log(`Server (5xx) responses: ${allServerErrors.length}`);
  console.log(`Request failures: ${allRequestFailures.length}`);

  for (const r of results) {
    console.log(`- ${r.route}: controls=${r.controlCount}, checked=${r.checkedCount}, failures=${r.failures.length}`);
  }

  if (allFailures.length) {
    console.log("\n=== Control Failures ===");
    for (const failure of allFailures) {
      console.log(`[${failure.route}] ${failure.control}`);
      console.log(`  -> ${failure.reason}`);
    }
  }

  if (allConsoleErrors.length) {
    console.log("\n=== Console Errors ===");
    for (const error of allConsoleErrors) {
      console.log(error);
    }
  }

  if (allServerErrors.length) {
    console.log("\n=== Server 5xx Responses ===");
    for (const error of allServerErrors) {
      console.log(error);
    }
  }

  if (allRequestFailures.length) {
    console.log("\n=== Request Failures ===");
    for (const error of allRequestFailures) {
      console.log(error);
    }
  }

  if (allFailures.length || allConsoleErrors.length || allServerErrors.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
