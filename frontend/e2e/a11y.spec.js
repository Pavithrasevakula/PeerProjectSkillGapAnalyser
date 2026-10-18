import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { hasCredentials, signIn } from "./helpers.js";

// Automated WCAG 2.x A/AA checks (axe-core). These catch roughly a third of accessibility
// issues; manual keyboard and screen-reader testing is still required for full conformance.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page, label) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 8).map((node) => `${node.target.join(" ")} :: ${node.failureSummary?.split("\n")[1]?.trim() || ""}`),
  }));
  // Soft assertion: report every page's violations in one run instead of stopping at the first.
  expect.soft(summary, `${label} accessibility violations`).toEqual([]);
}

test.describe("accessibility (public)", () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    test(`login, sign-up, reset and 404 at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await expectNoViolations(page, "login");

      await page.getByRole("button", { name: "Create one now" }).click();
      await expectNoViolations(page, "sign-up");

      await page.getByRole("button", { name: "Back to sign in" }).click();
      await page.getByRole("button", { name: "Forgot your password?" }).click();
      await expectNoViolations(page, "reset");

      await page.getByLabel("Email address").fill("bad");
      await page.getByRole("button", { name: "Send reset link" }).click();
      await expectNoViolations(page, "form error state");

      await page.goto("/missing");
      await expectNoViolations(page, "404");
    });
  }

  test("offline page", async ({ page }) => {
    await page.goto("/offline.html");
    await expectNoViolations(page, "offline page");
  });
});

test.describe("accessibility (signed in)", () => {
  test.skip(!hasCredentials, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated specs");

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    test(`main pages at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await signIn(page);
      for (const path of ["/", "/dashboard", "/team-lab", "/profile", "/projects/new"]) {
        await page.goto(path);
        await expect(page.locator("main h1").first()).toBeVisible({ timeout: 20_000 });
        await page.waitForTimeout(800);
        await expectNoViolations(page, path);
      }

      await page.goto("/");
      const card = page.locator("a.project-card").first();
      await expect(card).toBeVisible({ timeout: 15_000 });
      await card.click();
      await expect(page.locator("main h1").first()).toBeVisible();
      await page.waitForTimeout(1200);
      await expectNoViolations(page, "project detail");
    });
  }

  test("account menu open state", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page);
    await page.locator("#desktop-account-trigger").click();
    await expectNoViolations(page, "desktop account menu");
  });
});
