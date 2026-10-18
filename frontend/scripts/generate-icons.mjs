// Renders the PWA PNG icons from the SVG sources using a locally installed Chrome/Edge.
// Usage: npm run icons      (set CHROME_PATH if the browser is not auto-detected)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const outDir = join(root, "public", "icons");

const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = candidates.find((path) => existsSync(path));
if (!browser) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser.");
  process.exit(1);
}

const jobs = [
  { source: join(root, "public", "favicon.svg"), file: "icon-192.png", size: 192, transparent: true },
  { source: join(root, "public", "favicon.svg"), file: "icon-512.png", size: 512, transparent: true },
  { source: join(root, "public", "favicon.svg"), file: "apple-touch-icon.png", size: 180, transparent: false },
  { source: join(root, "scripts", "maskable-source.svg"), file: "maskable-512.png", size: 512, transparent: false },
];

mkdirSync(outDir, { recursive: true });
const work = mkdtempSync(join(tmpdir(), "teamsync-icons-"));

try {
  for (const job of jobs) {
    const page = join(work, `${job.file}.html`);
    const background = job.transparent ? "transparent" : "#244c43";
    writeFileSync(
      page,
      `<!doctype html><html><body style="margin:0;background:${background}">` +
        `<img src="${pathToFileURL(job.source).href}" width="${job.size}" height="${job.size}" style="display:block"></body></html>`,
    );
    const target = join(outDir, job.file);
    const result = spawnSync(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        `--user-data-dir=${join(work, "profile")}`,
        `--window-size=${job.size},${job.size}`,
        job.transparent ? "--default-background-color=00000000" : "--default-background-color=ff244c43",
        `--screenshot=${target}`,
        pathToFileURL(page).href,
      ],
      { stdio: "pipe", timeout: 60000 },
    );
    if (result.status !== 0 || !existsSync(target)) {
      console.error(`Failed to render ${job.file}`, result.stderr?.toString());
      process.exit(1);
    }
    console.log(`wrote public/icons/${job.file} (${job.size}x${job.size})`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
