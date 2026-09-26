/**
 * GrantThrive Static Pre-renderer
 * ================================
 * Runs after `vite build` to snapshot each marketing route as a standalone
 * HTML file. Each file gets its own correct <title>, <meta description>,
 * <link rel="canonical">, and og:url — solving the identical-meta-tags
 * problem for crawlers that do not execute JavaScript.
 *
 * Usage:
 *   node scripts/prerender.mjs
 *
 * Called automatically by the build pipeline via the "build" npm script.
 */

import { launch } from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import handler from 'serve-handler';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const BASE_URL = 'https://grantthrive.com';

const ROUTES = [
  { path: '/',               canonical: `${BASE_URL}/` },
  { path: '/features',       canonical: `${BASE_URL}/features` },
  { path: '/pricing',        canonical: `${BASE_URL}/pricing` },
  { path: '/roi-calculator', canonical: `${BASE_URL}/roi-calculator` },
  { path: '/resources',      canonical: `${BASE_URL}/resources` },
  { path: '/contact',        canonical: `${BASE_URL}/contact` },
];

const PORT = 7788;

// ── Serve the dist directory on a local port ──────────────────────────────
function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      handler(req, res, {
        public: DIST_DIR,
        rewrites: [{ source: '**', destination: '/index.html' }],
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

// ── Patch canonical and og:url in the rendered HTML ──────────────────────
function patchCanonical(html, canonical) {
  return html
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${canonical}" />`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${canonical}" />`
    );
}

// ── Write the HTML to the correct output path ────────────────────────────
function writeRoute(routePath, html) {
  if (routePath === '/') {
    writeFileSync(join(DIST_DIR, 'index.html'), html, 'utf8');
    return;
  }
  const dir = join(DIST_DIR, routePath.replace(/^\//, ''));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('[prerender] Starting local server on port', PORT);
  const server = await startServer();

  const browser = await launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });

  console.log('[prerender] Browser launched');

  try {
    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route.path}`;
      console.log(`[prerender] Rendering ${route.path} ...`);

      const page = await browser.newPage();

      // Wait for the render-event dispatched by main.jsx
      await Promise.race([
        new Promise((resolve) => {
          page.evaluateOnNewDocument(() => {
            document.addEventListener('render-event', () => {
              window.__PRERENDER_READY__ = true;
            });
          });
        }),
        page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 }),
      ]);

      // Give React a moment to finish any async state updates
      await page.waitForFunction(() => document.title !== '', { timeout: 10000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 800));

      const html = await page.content();
      const patched = patchCanonical(html, route.canonical);
      writeRoute(route.path, patched);

      const title = await page.title();
      console.log(`[prerender] ✓ ${route.path} — "${title}"`);

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('[prerender] All routes pre-rendered successfully.');
}

main().catch((err) => {
  console.error('[prerender] FAILED:', err);
  process.exit(1);
});
