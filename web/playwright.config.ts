import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
// Set E2E_BASE_URL to test a deployed app (for example production) instead of a local build.
const externalBaseURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: externalBaseURL ?? `http://localhost:${port}`,
    // Use the locally installed Google Chrome instead of downloading a browser build.
    channel: "chrome",
    trace: "retain-on-failure",
    video: process.env.E2E_VIDEO ? "on" : "off",
  },
  webServer: externalBaseURL
    ? undefined
    : {
        // CI builds the app in an earlier step; locally, build before starting.
        command: process.env.CI
          ? `npm run start -- --port ${port}`
          : `npm run build && npm run start -- --port ${port}`,
        url: `http://localhost:${port}`,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
});
