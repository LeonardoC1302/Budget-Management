/* Service worker: installability plus an offline app shell.
 *
 * - Hashed static assets and icons: cache-first (they never change in place).
 * - Page navigations: network-first; the last good HTML for each route is kept
 *   so the app still opens with no connection. Every route is warmed at
 *   install, along with the scripts and styles its HTML references, so a route
 *   never visited online still opens offline.
 * - Everything else (Firestore, exchange rates, /api) bypasses the cache.
 *   Firestore keeps its own offline copy in IndexedDB.
 *
 * Next's client-side navigations fetch RSC payloads. Offline those fail and
 * Next falls back to a full page load, which lands in the navigation handler.
 */

const CACHE_NAME = "perch-shell-v5";

const APP_ROUTES = [
  "/",
  "/home",
  "/privacy",
  "/terms",
  "/transactions",
  "/add",
  "/budgets",
  "/goals",
  "/recurring",
  "/accounts",
  "/investments",
  "/cards",
  "/rates",
  "/settings",
  "/settings/connections",
  "/settings/trash",
  "/settings/data",
  "/settings/security",
  "/settings/delete-account",
];

const STATIC_PREFIXES = ["/_next/static/"];
const STATIC_EXACT = new Set([
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-icon",
  "/favicon.ico",
  "/manifest.webmanifest",
]);

function isStatic(url) {
  if (url.origin !== self.location.origin) return false;
  if (STATIC_EXACT.has(url.pathname)) return true;
  return STATIC_PREFIXES.some((p) => url.pathname.startsWith(p));
}

// Cache key for a page: path only, so query strings don't fragment the cache.
function pageKey(url) {
  return new Request(new URL(url.pathname, self.location.origin).href);
}

async function cacheAssetsFrom(html, cache) {
  const urls = new Set();
  for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) {
    urls.add(match[0]);
  }
  await Promise.all(
    [...urls].map(async (path) => {
      if (await cache.match(path)) return;
      try {
        const res = await fetch(path);
        if (res.ok) await cache.put(path, res);
      } catch {
        // Best effort: a missed asset only matters if the user goes offline.
      }
    }),
  );
}

async function warmRoute(path, cache) {
  try {
    const res = await fetch(path, { credentials: "same-origin" });
    if (!res.ok) return;
    await cache.put(pageKey(new URL(path, self.location.origin)), res.clone());
    await cacheAssetsFrom(await res.text(), cache);
  } catch {
    // Offline during install; the route gets cached on its next online visit.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(APP_ROUTES.map((path) => warmRoute(path, cache)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function handleNavigation(req) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(req.url);
  try {
    const fresh = await fetch(req);
    if (fresh.ok && fresh.type === "basic") {
      const copy = fresh.clone();
      // Refresh this page and its assets in the background after a deploy.
      copy
        .text()
        .then((html) =>
          cache
            .put(
              pageKey(url),
              new Response(html, { headers: fresh.headers }),
            )
            .then(() => cacheAssetsFrom(html, cache)),
        )
        .catch(() => {});
    }
    return fresh;
  } catch (err) {
    const cached =
      (await cache.match(pageKey(url))) ?? (await cache.match(pageKey(new URL("/", url))));
    if (cached) return cached;
    throw err;
  }
}

async function handleStatic(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  if (fresh.ok) cache.put(req, fresh.clone());
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(handleNavigation(req));
    return;
  }
  if (isStatic(url)) {
    event.respondWith(handleStatic(req));
  }
});
