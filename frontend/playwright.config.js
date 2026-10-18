import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PORT || 5050);

// Tests run against the production build served with the headers from firebase.json
// (`npm run build` first, or use `npm run test:e2e`). They use the locally installed Chrome,
// so no browser download is needed. Authenticated specs are skipped unless E2E_EMAIL and
// E2E_PASSWORD are set; they never create, edit or delete data.
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/serve-dist.mjs",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 30_000,
    env: { PORT: String(PORT) },
  },
});
