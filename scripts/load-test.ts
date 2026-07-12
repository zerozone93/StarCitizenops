import "dotenv/config";
import { request, type APIRequestContext } from "@playwright/test";

type ScenarioName =
  | "public-home"
  | "public-login"
  | "signed-out-dashboard"
  | "signed-in-dashboard"
  | "signed-in-organizations"
  | "signed-in-notification-counts"
  | "signed-in-social";

type ScenarioResult = {
  userIndex: number;
  scenario: ScenarioName;
  ok: boolean;
  details: string;
};

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TOTAL_USERS = Number(process.env.USER_COUNT || 1000);
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 100));
const AUTH_ACCOUNTS = [
  { email: process.env.AUTH_EMAIL || "guide.user@starcitizenops.local", password: process.env.AUTH_PASSWORD || "GuidePass123!" },
  { email: "commander@starcitizenops.local", password: "password123" },
  { email: "zerozone2@live.com", password: "zerozone93" },
];

function scenarioForUser(userIndex: number): ScenarioName {
  switch (userIndex % 7) {
    case 0:
      return "public-home";
    case 1:
      return "public-login";
    case 2:
      return "signed-out-dashboard";
    case 3:
      return "signed-in-dashboard";
    case 4:
      return "signed-in-organizations";
    case 5:
      return "signed-in-notification-counts";
    default:
      return "signed-in-social";
  }
}

async function readBodyText(response: Awaited<ReturnType<APIRequestContext["get"]>>): Promise<string> {
  const contentType = response.headers()["content-type"] || "";
  if (contentType.includes("application/json")) {
    return JSON.stringify(await response.json());
  }

  return await response.text();
}

async function authenticate(context: APIRequestContext): Promise<boolean> {
  for (const account of AUTH_ACCOUNTS) {
    const csrfResponse = await context.get("/api/auth/csrf");
    if (!csrfResponse.ok()) continue;

    let csrfPayload: { csrfToken?: string } | null = null;
    try {
      csrfPayload = (await csrfResponse.json()) as { csrfToken?: string };
    } catch {
      continue;
    }
    if (!csrfPayload.csrfToken) continue;

    await context.post("/api/auth/callback/credentials", {
      form: {
        csrfToken: csrfPayload.csrfToken,
        email: account.email,
        password: account.password,
        callbackUrl: `${BASE_URL}/dashboard`,
      },
      failOnStatusCode: false,
    });

    const sessionResponse = await context.get("/api/auth/session");
    if (!sessionResponse.ok()) continue;

    let session: {
      user?: { email?: string; twoFactorPending?: boolean };
    } | null = null;
    try {
      session = (await sessionResponse.json()) as {
        user?: { email?: string; twoFactorPending?: boolean };
      };
    } catch {
      continue;
    }

    if (session?.user?.email && session.user.twoFactorPending !== true) {
      return true;
    }
  }

  return false;
}

async function runScenario(userIndex: number): Promise<ScenarioResult> {
  const scenario = scenarioForUser(userIndex);
  const context = await request.newContext({ baseURL: BASE_URL });

  try {
    if (scenario === "public-home") {
      const response = await context.get("/");
      const body = await readBodyText(response);
      if (!response.ok()) return { userIndex, scenario, ok: false, details: `GET / returned ${response.status()}` };
      if (!body.includes("StarCitizenOps")) {
        return { userIndex, scenario, ok: false, details: "GET / did not include StarCitizenOps" };
      }
      return { userIndex, scenario, ok: true, details: "home page ok" };
    }

    if (scenario === "public-login") {
      const response = await context.get("/login");
      if (!response.ok()) return { userIndex, scenario, ok: false, details: `GET /login returned ${response.status()}` };
      if (!response.url().includes("/login")) {
        return { userIndex, scenario, ok: false, details: `GET /login did not render the login route (${response.url()})` };
      }
      return { userIndex, scenario, ok: true, details: "login page ok" };
    }

    if (scenario === "signed-out-dashboard") {
      const response = await context.get("/dashboard");
      if (!response.url().includes("/login")) {
        return { userIndex, scenario, ok: false, details: `GET /dashboard did not redirect to login (${response.url()})` };
      }
      return { userIndex, scenario, ok: true, details: "protected redirect ok" };
    }

    const authenticated = await authenticate(context);
    if (!authenticated) {
      return { userIndex, scenario, ok: false, details: "authentication failed" };
    }

    if (scenario === "signed-in-dashboard") {
      const response = await context.get("/dashboard");
      const body = await readBodyText(response);
      if (!response.ok()) return { userIndex, scenario, ok: false, details: `GET /dashboard returned ${response.status()}` };
      if (response.url().includes("/login")) {
        return { userIndex, scenario, ok: false, details: "authenticated dashboard redirected to login" };
      }
      if (!body.includes("Command Snapshot") && !body.includes("Dashboard")) {
        return { userIndex, scenario, ok: false, details: "dashboard content check failed" };
      }
      return { userIndex, scenario, ok: true, details: "dashboard ok" };
    }

    if (scenario === "signed-in-organizations") {
      const response = await context.get("/organizations");
      const body = await readBodyText(response);
      if (!response.ok()) return { userIndex, scenario, ok: false, details: `GET /organizations returned ${response.status()}` };
      if (response.url().includes("/login")) {
        return { userIndex, scenario, ok: false, details: "authenticated organizations redirected to login" };
      }
      if (!body.includes("Organizations") && !body.includes("Command structures")) {
        return { userIndex, scenario, ok: false, details: "organizations content check failed" };
      }
      return { userIndex, scenario, ok: true, details: "organizations ok" };
    }

    if (scenario === "signed-in-notification-counts") {
      const response = await context.get("/api/notifications/counts");
      if (!response.ok()) return { userIndex, scenario, ok: false, details: `GET /api/notifications/counts returned ${response.status()}` };

      const payload = (await response.json()) as { notifications?: unknown; messages?: unknown };
      if (typeof payload.notifications !== "number" || typeof payload.messages !== "number") {
        return { userIndex, scenario, ok: false, details: "notification counts payload was malformed" };
      }
      return { userIndex, scenario, ok: true, details: "notification counts ok" };
    }

    const response = await context.get("/social");
    const body = await readBodyText(response);
    if (!response.ok()) return { userIndex, scenario, ok: false, details: `GET /social returned ${response.status()}` };
    if (response.url().includes("/login")) {
      return { userIndex, scenario, ok: false, details: "authenticated social redirected to login" };
    }
    if (!body.includes("Social") && !body.includes("forum") && !body.includes("discussion")) {
      return { userIndex, scenario, ok: false, details: "social content check failed" };
    }
    return { userIndex, scenario, ok: true, details: "social ok" };
  } finally {
    await context.dispose();
  }
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) return;
      await worker(items[currentIndex]);
    }
  });

  await Promise.all(workers);
}

async function main(): Promise<void> {
  const results: ScenarioResult[] = [];
  const userIndexes = Array.from({ length: TOTAL_USERS }, (_, index) => index + 1);
  const startedAt = Date.now();

  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Virtual users: ${TOTAL_USERS}`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  await runPool(userIndexes, CONCURRENCY, async (userIndex) => {
    let result: ScenarioResult;
    try {
      result = await runScenario(userIndex);
    } catch (error) {
      result = {
        userIndex,
        scenario: scenarioForUser(userIndex),
        ok: false,
        details: error instanceof Error ? `scenario crashed: ${error.message}` : "scenario crashed",
      };
    }
    results.push(result);
    const marker = result.ok ? "OK" : "FAIL";
    console.log(`[${marker}] user ${String(result.userIndex).padStart(4, "0")} ${result.scenario}: ${result.details}`);
  });

  const elapsedMs = Date.now() - startedAt;
  const failures = results.filter((result) => !result.ok);
  const scenarioCounts = results.reduce<Record<ScenarioName, { ok: number; fail: number }>>((acc, result) => {
    acc[result.scenario] ??= { ok: 0, fail: 0 };
    if (result.ok) acc[result.scenario].ok += 1;
    else acc[result.scenario].fail += 1;
    return acc;
  }, {
    "public-home": { ok: 0, fail: 0 },
    "public-login": { ok: 0, fail: 0 },
    "signed-out-dashboard": { ok: 0, fail: 0 },
    "signed-in-dashboard": { ok: 0, fail: 0 },
    "signed-in-organizations": { ok: 0, fail: 0 },
    "signed-in-notification-counts": { ok: 0, fail: 0 },
    "signed-in-social": { ok: 0, fail: 0 },
  });

  console.log("\n=== Load Test Summary ===");
  console.log(`Completed users: ${results.length}`);
  console.log(`Passed: ${results.length - failures.length}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Elapsed: ${(elapsedMs / 1000).toFixed(1)}s`);

  for (const [scenario, counts] of Object.entries(scenarioCounts) as Array<[ScenarioName, { ok: number; fail: number }]>) {
    console.log(`${scenario}: ok=${counts.ok}, fail=${counts.fail}`);
  }

  if (failures.length) {
    console.log("\n=== First Failures ===");
    for (const failure of failures.slice(0, 20)) {
      console.log(`[user ${failure.userIndex}] ${failure.scenario}: ${failure.details}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});