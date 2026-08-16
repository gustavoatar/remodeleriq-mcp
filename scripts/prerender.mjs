// Prerender static "knowledge" routes of the SPA so crawlers + AI engines
// (which don't run JS) get real HTML. Post-build step: serve dist/client, load
// each route in headless Chrome, wait for React to render, save the resulting
// HTML to <route>/index.html. main.tsx hydrates over it (no UX change).
//
// Only fully-static routes are listed here (no client-side data fetch, or they'd
// prerender a loading spinner). Run after `vite build`, before `wrangler deploy`.
import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist", "client");
const ROUTES = [
  "/how-we-score",
  "/glossary",
  "/tools",
  "/premium",
  "/is-my-contractor-quote-fair",
  "/vs/chatgpt",
  "/vs/bidcompare-ai",
  "/vs/estimatehawk",
  "/use-with-ai",
  "/use-with-claude",
  "/use-with-chatgpt",
  "/chat-gpt-plugin",
];
const PORT = 5099;

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff",
  ".txt": "text/plain", ".xml": "application/xml", ".map": "application/json",
};

// Minimal static server with SPA fallback so React Router resolves each route.
const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent((req.url || "/").split("?")[0]);
    let filePath = join(DIST, p);
    if (p.endsWith("/")) filePath = join(filePath, "index.html");
    if (!extname(filePath) || !existsSync(filePath)) filePath = join(DIST, "index.html");
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(PORT, r));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });

let ok = 0;
for (const route of ROUTES) {
  const page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle0", timeout: 45000 });
    // Wait until React has painted real content into #root.
    await page.waitForFunction(
      () => {
        const r = document.getElementById("root");
        return r && r.children.length > 0 && (r.innerText || "").trim().length > 300;
      },
      { timeout: 30000 }
    );
    // index.html ships static SEO fallbacks (marked [data-default]) for the
    // routes we don't prerender, where crawlers get no JS. Helmet adds this
    // route's own tags at runtime but never removes the static ones, so the
    // captured HTML carried two of everything — and since the two families land
    // in opposite orders, scrapers read the page title off Helmet's tag but the
    // og:* preview off the generic fallback, pointing every share at "/".
    // Drop each fallback that Helmet superseded; leave the rest as real defaults.
    const dropped = await page.evaluate(() => {
      const idOf = (el) =>
        el.tagName === "TITLE"
          ? "title"
          : `${el.getAttribute("name") ? "name" : el.getAttribute("property") ? "property" : "rel"}=${
              el.getAttribute("name") || el.getAttribute("property") || el.getAttribute("rel")
            }`;
      const all = [...document.head.querySelectorAll("title, meta, link")];
      const supersededIds = new Set(all.filter((el) => !el.hasAttribute("data-default")).map(idOf));
      const removed = [];
      for (const el of all) {
        if (el.hasAttribute("data-default") && supersededIds.has(idOf(el))) {
          removed.push(idOf(el));
          el.remove();
        }
      }
      return removed;
    });
    const html = await page.content();
    // Write as "<route>.html" (NOT "<route>/index.html") so Cloudflare serves it
    // at the clean, no-trailing-slash URL the app + internal links use — a
    // directory index.html forces a 307 to the trailing-slash variant.
    const outFile = join(DIST, `${route.replace(/^\//, "")}.html`);
    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, html);
    console.log(
      `  ✓ prerendered ${route} -> ${route.replace(/^\//, "")}.html (${(html.length / 1024).toFixed(0)} KB, ${dropped.length} dup tags dropped)`
    );
    ok++;
  } catch (e) {
    console.error(`  ✗ failed ${route}: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();
console.log(`prerender: ${ok}/${ROUTES.length} routes done`);
if (ok === 0) process.exit(1);
