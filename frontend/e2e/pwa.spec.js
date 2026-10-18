import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

function pngSize(buffer) {
  // PNG signature (8 bytes) + IHDR chunk: width/height are big-endian uint32 at offsets 16 and 20.
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test.describe("PWA", () => {
  test("manifest declares installable metadata and real icons", async ({ page, request }) => {
    await page.goto("/login");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBe("/manifest.json");

    const response = await request.get(href);
    expect(response.ok()).toBe(true);
    const manifest = await response.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);

    const purposes = (size, purpose) =>
      manifest.icons.filter((icon) => icon.sizes === size && icon.type === "image/png" && icon.purpose === purpose);
    expect(purposes("192x192", "any")).toHaveLength(1);
    expect(purposes("512x512", "any")).toHaveLength(1);
    expect(purposes("512x512", "maskable")).toHaveLength(1);

    for (const icon of manifest.icons.filter((item) => item.type === "image/png")) {
      const iconResponse = await request.get(icon.src);
      expect(iconResponse.status(), icon.src).toBe(200);
      expect(iconResponse.headers()["content-type"]).toBe("image/png");
      const [width, height] = icon.sizes.split("x").map(Number);
      expect(pngSize(await iconResponse.body()), icon.src).toEqual({ width, height });
    }

    expect((await request.get("/icons/apple-touch-icon.png")).status()).toBe(200);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/icons/apple-touch-icon.png");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#244c43");
  });

  test("service worker installs, takes control and only caches same-origin static files", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

    const cached = await page.evaluate(async () => {
      const urls = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) urls.push(`${name} ${request.url}`);
      }
      return urls;
    });
    const origin = new URL(page.url()).origin;
    expect(cached.length).toBeGreaterThan(0);
    for (const entry of cached) {
      const [cacheName, url] = entry.split(" ");
      expect(cacheName).toMatch(/^teamsync-v\d+$/);
      expect(url.startsWith(`${origin}/`), `${url} should be same-origin (${origin})`).toBe(true);
      expect(entry).not.toMatch(/googleapis|cloudfunctions|\/api\/|\/__\//);
    }
    expect(cached.some((entry) => entry.endsWith("/offline.html"))).toBe(true);
  });

  test("offline navigation shows the offline page and recovers when back online", async ({ page, context }) => {
    await page.goto("/login");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

    await context.setOffline(true);
    await page.goto("/dashboard").catch(() => {});
    await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.locator("#status")).toContainText("Still offline");

    // Reconnecting fires the browser "online" event; the offline page retries on its own.
    await context.setOffline(false);
    // The requested page (/dashboard) reloads; signed out, it redirects to the login page.
    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
  });

  test("a new service worker waits for the user, then updates on request", async ({ page }) => {
    const swPath = resolve(import.meta.dirname, "..", "dist", "sw.js");
    const original = readFileSync(swPath, "utf8");
    try {
      await page.goto("/login");
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload();
      await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
      await page.evaluate(() => { window.__sessionMarker = "still-here"; });
      await expect(page.getByText("A new version of TeamSync is ready.")).toHaveCount(0);

      // Simulate a deployment: a byte-different service worker file.
      writeFileSync(swPath, `${original}\n// e2e update simulation ${Date.now()}\n`);
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration.update();
      });

      await expect(page.getByText("A new version of TeamSync is ready.")).toBeVisible({ timeout: 15_000 });
      // The page must NOT have been reloaded underneath the user.
      expect(await page.evaluate(() => window.__sessionMarker)).toBe("still-here");

      await Promise.all([
        page.waitForEvent("load"),
        page.getByRole("button", { name: "Reload to update" }).click(),
      ]);
      await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
      expect(await page.evaluate(() => window.__sessionMarker)).toBeUndefined();
      await expect(page.getByText("A new version of TeamSync is ready.")).toHaveCount(0);
    } finally {
      writeFileSync(swPath, original);
    }
  });

  test("security and cache headers are sent", async ({ request }) => {
    const home = await request.get("/");
    const headers = home.headers();
    expect(headers["content-security-policy"]).toContain("script-src 'self'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["cache-control"]).toBe("no-cache");

    expect((await request.get("/sw.js")).headers()["cache-control"]).toBe("no-cache");

    const html = await home.text();
    const asset = html.match(/\/assets\/[^"']+\.js/)?.[0];
    expect(asset).toBeTruthy();
    expect((await request.get(asset)).headers()["cache-control"]).toContain("immutable");
  });

  test("build output does not contain private keys or server credentials", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((match) => match[1]);
    expect(assets.length).toBeGreaterThan(0);
    for (const path of assets) {
      const body = await (await request.get(path)).text();
      expect(body, path).not.toMatch(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/);
      expect(body, path).not.toMatch(/"private_key"/);
      expect(body, path).not.toMatch(/client_secret/);
    }
  });
});
