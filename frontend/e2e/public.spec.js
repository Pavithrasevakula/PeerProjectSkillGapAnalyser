import { test, expect } from "@playwright/test";
import { trackProblems } from "./helpers.js";

test.describe("public pages", () => {
  test("login page renders with a title, heading and no console problems", async ({ page }) => {
    const problems = trackProblems(page);
    await page.goto("/login");
    await expect(page).toHaveTitle("Sign in - TeamSync");
    await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await page.waitForLoadState("networkidle");
    // Give late-loading SDK scripts a chance to run (e.g. a blocked third-party script would log a CSP error).
    await page.waitForTimeout(3000);
    expect(problems).toEqual([]);
  });

  test("protected routes redirect signed-out visitors to the login page", async ({ page }) => {
    for (const path of ["/", "/dashboard", "/profile", "/team-lab", "/projects/new"]) {
      await page.goto(path);
      await expect(page, `visiting ${path}`).toHaveURL(/\/login$/);
    }
  });

  test("unknown URLs show a 404 page with a way back", async ({ page }) => {
    await page.goto("/this/page/does-not-exist");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page).toHaveTitle("Page not found - TeamSync");
    await page.getByRole("link", { name: "Browse projects" }).click();
    await expect(page).toHaveURL(/\/login$/); // signed out, so the protected home redirects
  });

  test("sign-in form validates empty and malformed input without calling the server", async ({ page }) => {
    await page.goto("/login");
    const submit = page.getByRole("button", { name: "Sign in to workspace" });

    await submit.click();
    await expect(page.getByRole("alert")).toHaveText("Enter a valid email address.");

    await page.getByLabel("Email address").fill("not-an-email");
    await submit.click();
    await expect(page.getByRole("alert")).toHaveText("Enter a valid email address.");

    await page.getByLabel("Email address").fill("someone@example.com");
    await submit.click();
    await expect(page.getByRole("alert")).toHaveText("Enter your password.");
  });

  test("sign-up form rejects short passwords locally", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Create one now" }).click();
    await expect(page.getByRole("heading", { name: "Create your workspace" })).toBeVisible();
    await page.getByLabel("Email address").fill("someone@example.com");
    await page.getByLabel("Password").fill("12345");
    await page.getByRole("button", { name: "Create account and start" }).click();
    await expect(page.getByRole("alert")).toHaveText("Use a password with at least six characters.");
  });

  test("wrong credentials show a generic error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("e2e-no-such-user@example.com");
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in to workspace" }).click();
    await expect(page.getByRole("alert")).toContainText(/incorrect|Too many attempts/);
  });

  test("password reset flow is reachable and gives a generic confirmation", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot your password?" }).click();
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(page.getByLabel("Password")).toHaveCount(0);

    await page.getByLabel("Email address").fill("bad");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("alert")).toHaveText("Enter a valid email address.");

    await page.getByLabel("Email address").fill("e2e-no-such-user@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status").filter({ hasText: "password reset link is on its way" })).toBeVisible();

    await page.getByRole("button", { name: "Back to sign in" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
  });

  test("skip link moves focus to the main region", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
  });
});
