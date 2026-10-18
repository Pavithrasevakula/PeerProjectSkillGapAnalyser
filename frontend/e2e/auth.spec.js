import { test, expect } from "@playwright/test";
import { VIEWPORTS, expectNoHorizontalOverflow, hasCredentials, signIn, trackProblems } from "./helpers.js";

// These specs sign in with a real test account (E2E_EMAIL / E2E_PASSWORD) and only read data.
test.skip(!hasCredentials, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated specs");

const ROUTES = [
  { path: "/", title: "Projects - TeamSync" },
  { path: "/dashboard", title: "Overview - TeamSync" },
  { path: "/team-lab", title: "Team Lab - TeamSync" },
  { path: "/profile", title: "Profile - TeamSync" },
  { path: "/projects/new", title: "Post a project - TeamSync" },
];

async function settle(page) {
  // Firestore keeps long-lived connections open, so "networkidle" never fires. Wait for the
  // lazy route to render its page heading instead, then give first snapshots a moment to land.
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(500);
}

test.describe("signed-in experience", () => {
  test("sign in lands on projects and every main page loads cleanly", async ({ page }) => {
    const problems = trackProblems(page);
    await signIn(page);
    await expect(page).toHaveURL(/\/$/);

    for (const route of ROUTES) {
      await page.goto(route.path);
      await settle(page);
      await expect(page, route.path).toHaveTitle(route.title);
      await expect(page.locator("main h1"), `${route.path} should have one h1`).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
    }
    expect(problems).toEqual([]);
  });

  test("signed-in visitors are redirected away from the login page", async ({ page }) => {
    await signIn(page);
    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("account menu opens, closes with Escape and signs out", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page);
    const trigger = page.locator("#desktop-account-trigger");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Profile" }).first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.mouse.click(700, 400);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Session is really gone: protected pages bounce back to login.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("project list opens a project and the detail page renders", async ({ page }) => {
    const problems = trackProblems(page);
    await signIn(page);
    await settle(page);
    const firstProject = page.locator("a.project-card").first();
    await expect(firstProject).toBeVisible({ timeout: 15_000 });
    await firstProject.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
    await settle(page);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page).toHaveTitle("Project details - TeamSync");
    expect(problems.filter((problem) => !/cloudfunctions|CORS/i.test(problem))).toEqual([]);
  });

  test("unknown URLs show the 404 page inside the app shell", async ({ page }) => {
    await signIn(page);
    await page.goto("/definitely-not-a-page");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("navigation adapts: sidebar on desktop, bottom bar on phones", async ({ page }) => {
    await signIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.locator("aside.sidebar")).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("aside.sidebar")).toBeHidden();
    const bottomNav = page.locator("nav").last();
    await expect(bottomNav).toBeVisible();
    const links = bottomNav.getByRole("link");
    expect(await links.count()).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < (await links.count()); i += 1) {
      await expect(links.nth(i)).toBeInViewport({ ratio: 1 });
    }
  });
});

test.describe("signed-in pages are responsive", () => {
  for (const viewport of VIEWPORTS) {
    test(`no horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await signIn(page);
      for (const route of ROUTES) {
        await page.goto(route.path);
        await settle(page);
        await expectNoHorizontalOverflow(page);
      }
      await page.goto("/missing");
      await expectNoHorizontalOverflow(page);
    });
  }
});
