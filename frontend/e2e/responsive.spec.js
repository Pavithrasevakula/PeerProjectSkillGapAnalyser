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
      // Layout order: the TeamSync story comes first; on phones the sign-in form sits below it,
      // from 1024px up the two sit side by side (story left, form right).
      const story = await page.locator("section.login-story").boundingBox();
      const form = await page.locator("section.login-form-area").boundingBox();
      if (viewport.width < 1024) {
        expect(story.y, "story above form on small screens").toBeLessThan(form.y);
      } else {
        expect(story.x, "story left of form on large screens").toBeLessThan(form.x);
      }
      await page.getByLabel("Email address").scrollIntoViewIfNeeded();
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
