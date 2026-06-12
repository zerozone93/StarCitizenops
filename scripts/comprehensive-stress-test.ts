import "dotenv/config";
import { request } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://www.starcitizenopps.com";
const TEST_ACCOUNT = {
  email: process.env.AUTH_EMAIL || "welcome.test.1781115284@example.com",
  password: process.env.AUTH_PASSWORD || "StarOps!12345",
};

interface TestResult {
  variant: string;
  passed: number;
  failed: number;
  elapsed: number;
  avgResponseTime: number;
}

async function runConcurrentPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
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

async function runAuthOnlyTest(): Promise<TestResult> {
  console.log("\n🔐 Test 1: Auth-Only (2800 users, 400 concurrency)");
  const users = 2800;
  const concurrency = 400;
  let passed = 0;
  const times: number[] = [];
  const start = Date.now();

  await runConcurrentPool(Array(users).fill(0), concurrency, async () => {
    const t0 = Date.now();
    try {
      const ctx = await request.newContext({ baseURL: BASE_URL });
      const csrf = await ctx.get("/api/auth/csrf");
      const data: any = await csrf.json();
      if (!data.csrfToken) throw new Error("no csrf");

      await ctx.post("/api/auth/callback/credentials", {
        form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
        failOnStatusCode: false,
      });

      const session = await ctx.get("/api/auth/session");
      const sess: any = await session.json();
      if (sess?.user?.email) passed++;
      await ctx.dispose();
    } catch {
      //
    }
    times.push(Date.now() - t0);
  });

  return { variant: "auth-only", passed, failed: users - passed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / users };
}

async function runDbPoolTest(): Promise<TestResult> {
  console.log("\n💾 Test 2: DB Pool (1400 users, 200 concurrency)");
  const users = 1400;
  const concurrency = 200;
  let passed = 0;
  const times: number[] = [];
  const start = Date.now();

  await runConcurrentPool(Array(users).fill(0), concurrency, async () => {
    const t0 = Date.now();
    try {
      const ctx = await request.newContext({ baseURL: BASE_URL });
      const csrf = await ctx.get("/api/auth/csrf");
      const data: any = await csrf.json();
      if (!data.csrfToken) throw new Error("no csrf");

      await ctx.post("/api/auth/callback/credentials", {
        form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
        failOnStatusCode: false,
      });

      const notif = await ctx.get("/api/notifications/counts");
      const payload: any = await notif.json();
      if (typeof payload.notifications === "number" && typeof payload.messages === "number") passed++;
      await ctx.dispose();
    } catch {
      //
    }
    times.push(Date.now() - t0);
  });

  return { variant: "db-pool", passed, failed: users - passed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / users };
}

async function runPerEndpointTest(): Promise<TestResult> {
  console.log("\n🎯 Test 3: Per-Endpoint (2800 mixed)");
  const endpoints = ["/dashboard", "/organizations", "/social", "/api/notifications/counts"];
  let totalPassed = 0;
  let totalFailed = 0;
  const times: number[] = [];
  const start = Date.now();
  const concurrency = 200;

  for (const endpoint of endpoints) {
    console.log(`  Testing ${endpoint}...`);
    await runConcurrentPool(Array(700).fill(0), concurrency, async () => {
      const t0 = Date.now();
      try {
        const ctx = await request.newContext({ baseURL: BASE_URL });
        const csrf = await ctx.get("/api/auth/csrf");
        const data: any = await csrf.json();
        if (!data.csrfToken) throw new Error("no csrf");

        await ctx.post("/api/auth/callback/credentials", {
          form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
          failOnStatusCode: false,
        });

        const res = await ctx.get(endpoint);
        if (res.ok()) totalPassed++;
        else totalFailed++;
        await ctx.dispose();
      } catch {
        totalFailed++;
      }
      times.push(Date.now() - t0);
    });
  }

  return { variant: "per-endpoint", passed: totalPassed, failed: totalFailed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length };
}

async function runSustainedLoadTest(): Promise<TestResult> {
  console.log("\n⏱️ Test 4: Sustained (1400 users, 90 sec)");
  let passed = 0;
  let failed = 0;
  const times: number[] = [];
  const start = Date.now();
  const duration = 90000;

  while (Date.now() - start < duration) {
    await runConcurrentPool(Array(200).fill(0), 200, async () => {
      const t0 = Date.now();
      try {
        const ctx = await request.newContext({ baseURL: BASE_URL });
        const csrf = await ctx.get("/api/auth/csrf");
        const data: any = await csrf.json();
        if (!data.csrfToken) throw new Error("no csrf");

        await ctx.post("/api/auth/callback/credentials", {
          form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
          failOnStatusCode: false,
        });

        const dash = await ctx.get("/dashboard");
        if (dash.ok()) passed++;
        else failed++;
        await ctx.dispose();
      } catch {
        failed++;
      }
      times.push(Date.now() - t0);
    });
  }

  return { variant: "sustained-load", passed, failed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length };
}

async function run2FAFlowTest(): Promise<TestResult> {
  console.log("\n🔑 Test 5: 2FA Flow (500 users)");
  const users = 500;
  let passed = 0;
  const times: number[] = [];
  const start = Date.now();

  await runConcurrentPool(Array(users).fill(0), 100, async () => {
    const t0 = Date.now();
    try {
      const ctx = await request.newContext({ baseURL: BASE_URL });
      const csrf = await ctx.get("/api/auth/csrf");
      const data: any = await csrf.json();
      if (!data.csrfToken) throw new Error("no csrf");

      const auth = await ctx.post("/api/auth/callback/credentials", {
        form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
        failOnStatusCode: false,
      });

      if (auth.url().includes("/2fa-verify") || auth.url().includes("/dashboard")) passed++;
      await ctx.dispose();
    } catch {
      //
    }
    times.push(Date.now() - t0);
  });

  return { variant: "2fa-flow", passed, failed: users - passed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / users };
}

async function runRealWorldDistributionTest(): Promise<TestResult> {
  console.log("\n🌍 Test 6: Real-World (70% public, 20% read, 10% write)");
  const users = 2000;
  let passed = 0;
  let failed = 0;
  const times: number[] = [];
  const start = Date.now();

  await runConcurrentPool(Array(users).fill(0), 300, async () => {
    const t0 = Date.now();
    const rand = Math.random() * 100;
    try {
      const ctx = await request.newContext({ baseURL: BASE_URL });

      if (rand < 70) {
        const path = rand < 35 ? "/" : "/login";
        const res = await ctx.get(path);
        if (res.ok()) passed++;
        else failed++;
      } else if (rand < 90) {
        const csrf = await ctx.get("/api/auth/csrf");
        const data: any = await csrf.json();
        if (!data.csrfToken) throw new Error("no csrf");

        await ctx.post("/api/auth/callback/credentials", {
          form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
          failOnStatusCode: false,
        });

        const res = await ctx.get("/api/notifications/counts");
        if (res.ok()) passed++;
        else failed++;
      } else {
        const csrf = await ctx.get("/api/auth/csrf");
        const data: any = await csrf.json();
        if (!data.csrfToken) throw new Error("no csrf");

        await ctx.post("/api/auth/callback/credentials", {
          form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
          failOnStatusCode: false,
        });

        const res = await ctx.get("/dashboard");
        if (res.ok()) passed++;
        else failed++;
      }

      await ctx.dispose();
    } catch {
      failed++;
    }
    times.push(Date.now() - t0);
  });

  return { variant: "real-world", passed, failed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / users };
}

async function runErrorRecoveryTest(): Promise<TestResult> {
  console.log("\n🛡️ Test 7: Error Recovery (1000 users)");
  const users = 1000;
  let passed = 0;
  const times: number[] = [];
  const start = Date.now();

  await runConcurrentPool(Array(users).fill(0), 200, async () => {
    const t0 = Date.now();
    try {
      const ctx = await request.newContext({ baseURL: BASE_URL });

      // Test invalid CSRF
      const res1 = await ctx.post("/api/auth/callback/credentials", {
        form: { csrfToken: "bad", email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
        failOnStatusCode: false,
      });

      if (res1.status() === 403 || res1.status() === 400) passed++;

      // Test invalid password
      const csrf = await ctx.get("/api/auth/csrf");
      const data: any = await csrf.json();
      if (data.csrfToken) {
        const res2 = await ctx.post("/api/auth/callback/credentials", {
          form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: "wrong", callbackUrl: `${BASE_URL}/dashboard` },
          failOnStatusCode: false,
        });

        if (res2.status() === 401 || res2.status() === 400) passed++;
      }

      await ctx.dispose();
    } catch {
      //
    }
    times.push(Date.now() - t0);
  });

  return { variant: "error-recovery", passed, failed: users * 2 - passed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / users };
}

async function runAPIEndpointTest(): Promise<TestResult> {
  console.log("\n⚡ Test 8: API Endpoints (3000 users, 500 concurrency)");
  const users = 3000;
  let passed = 0;
  const times: number[] = [];
  const start = Date.now();

  await runConcurrentPool(Array(users).fill(0), 500, async () => {
    const t0 = Date.now();
    try {
      const ctx = await request.newContext({ baseURL: BASE_URL });
      const csrf = await ctx.get("/api/auth/csrf");
      const data: any = await csrf.json();
      if (!data.csrfToken) throw new Error("no csrf");

      await ctx.post("/api/auth/callback/credentials", {
        form: { csrfToken: data.csrfToken, email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password, callbackUrl: `${BASE_URL}/dashboard` },
        failOnStatusCode: false,
      });

      const api = await ctx.get("/api/notifications/counts", { timeout: 30000 });
      if (api.ok()) {
        const payload: any = await api.json();
        if (typeof payload.notifications === "number" && typeof payload.messages === "number") passed++;
      }

      await ctx.dispose();
    } catch {
      //
    }
    times.push(Date.now() - t0);
  });

  return { variant: "api-endpoints", passed, failed: users - passed, elapsed: (Date.now() - start) / 1000, avgResponseTime: times.reduce((a, b) => a + b, 0) / users };
}

async function main(): Promise<void> {
  console.log("🚀 Comprehensive Stress Test Suite");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  const tests = [runAuthOnlyTest, runDbPoolTest, runPerEndpointTest, runSustainedLoadTest, run2FAFlowTest, runRealWorldDistributionTest, runErrorRecoveryTest, runAPIEndpointTest];

  const results = await Promise.all(tests.map((t) => t().catch((e) => ({ variant: "error", passed: 0, failed: 999, elapsed: 0, avgResponseTime: 0 }))));

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("📊 RESULTS");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.table(results.map((r) => ({ Test: r.variant, Passed: r.passed, Failed: r.failed, "Avg (ms)": r.avgResponseTime.toFixed(0), "Time (s)": r.elapsed.toFixed(1) })));

  console.log(`\n✅ Suite completed at ${new Date().toISOString()}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
