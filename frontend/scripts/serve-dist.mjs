// Serves frontend/dist the way Firebase Hosting will: headers and SPA rewrites come from the
// repository's firebase.json. Use it to check CSP/cache headers and PWA behaviour on a
// production build before deploying:   npm run build && npm run serve:dist
//
// This is an approximation of Firebase Hosting for local verification only.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createGzip } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const firebaseConfig = JSON.parse(readFileSync(resolve(root, "..", "firebase.json"), "utf8"));
const hosting = firebaseConfig.hosting;
const publicDir = resolve(root, "..", hosting.public);
const port = Number(process.env.PORT || 5050);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

/** Convert a Firebase Hosting glob (`**`, `*`) into an anchored RegExp. */
function globToRegExp(glob) {
  let pattern = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*" && glob[i + 1] === "*") {
      pattern += ".*";
      i += 1;
    } else if (char === "*") {
      pattern += "[^/]*";
    } else {
      pattern += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${pattern}$`);
}

const headerRules = (hosting.headers || []).map((rule) => ({
  matcher: globToRegExp(rule.source),
  headers: rule.headers,
}));

function headersFor(pathname) {
  const result = {};
  for (const rule of headerRules) {
    if (rule.matcher.test(pathname)) {
      for (const { key, value } of rule.headers) result[key] = value;
    }
  }
  return result;
}

function resolveFile(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const candidate = resolve(publicDir, safe);
  if (!candidate.startsWith(publicDir)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const index = join(candidate, "index.html");
  if (existsSync(index)) return index;
  return null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  let file = resolveFile(pathname);
  if (!file) {
    // Missing static assets must 404; everything else is the SPA shell (the "**" rewrite).
    if (/\.[a-z0-9]+$/i.test(pathname)) {
      res.writeHead(404, headersFor(pathname));
      res.end("Not found");
      return;
    }
    file = join(publicDir, "index.html");
  }
  const type = MIME[extname(file)] || "application/octet-stream";
  const headers = { "Content-Type": type, ...headersFor(pathname) };
  // Firebase Hosting compresses text assets automatically; do the same here so timings are realistic.
  const compressible = /^(text\/|application\/(javascript|json)|image\/svg)/.test(type);
  if (compressible && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
    res.writeHead(200, { ...headers, "Content-Encoding": "gzip", Vary: "Accept-Encoding" });
    createReadStream(file).pipe(createGzip()).pipe(res);
    return;
  }
  res.writeHead(200, headers);
  createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving ${publicDir} with firebase.json headers on http://127.0.0.1:${port}`);
});
