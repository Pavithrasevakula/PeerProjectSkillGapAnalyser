import { test, expect } from "@playwright/test";
import { VIEWPORTS, expectNoHorizontalOverflow, trackProblems } from "./helpers.js";

test.describe("public pages are responsive", () => {
  for (const viewport of VIEWPORTS) {
    test(`login, sign-up, reset and 404 fit ${viewport.name}`, async ({ page }) => {
      const problems = trackProblems(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto("/login");
      await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      // The form must be usable without scrolling past the marketing panel on small screens.
      await expect(page.getByLabel("Email address")).toBeInViewport({ ratio: 1 });

      await page.getByRole("button", { name: "Create one now" }).click();
      await expectNoHorizontalOverflow(page);

      await page.getByRole("button", { name: "Back to sign in" }).click();
      await page.getByRole("button", { name: "Forgot your password?" }).click();
      await expectNoHorizontalOverflow(page);

      await page.goto("/missing-page");
      await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
      await expectNoHorizontalOverflow(page);

      expect(problems).toEqual([]);
    });
  }
});
