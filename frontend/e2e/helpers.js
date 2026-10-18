import { expect } from "@playwright/test";

export const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

export const hasCredentials = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

/** Collect page errors, console errors and CSP violations so tests can assert none occurred. */
export function trackProblems(page) {
  const problems = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText || "";
    // Aborted requests happen on navigation/teardown and are not application failures.
    if (!/ERR_ABORTED/.test(failure)) problems.push(`requestfailed: ${request.url()} ${failure}`);
  });
  return problems;
}

export async function expectNoHorizontalOverflow(page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${clientWidth}px viewport`).toBeLessThanOrEqual(clientWidth);
}

export async function signIn(page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(process.env.E2E_EMAIL);
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(page.locator("#desktop-account-trigger, #mobile-account-trigger").filter({ visible: true }).first()).toBeVisible({ timeout: 20_000 });
}
