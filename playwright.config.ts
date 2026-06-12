import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const HOST = "localhost";
const USE_DEV_SERVER = process.env.PLAYWRIGHT_USE_DEV_SERVER === "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: USE_DEV_SERVER
      ? `npm run dev -- --port ${PORT}`
      : process.env.CI
        ? `npm run start -- --port ${PORT}`
        : `npm run build && npm run start -- --port ${PORT}`,
    url: `http://${HOST}:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
