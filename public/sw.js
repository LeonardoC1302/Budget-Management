/* Service worker for installability + faster shell loads.
 * Cache-first for Next's hashed static assets and the PWA icons.
 * Everything else (HTML, Firestore, exchange rates) bypasses the cache
 * so the app stays live. */

const CACHE_NAME = "perch-shell-v2";

const STATIC_PREFIXES = ["/_next/static/"];
const STATIC_EXACT = new Set([
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-icon",
  "/favicon.ico",
  "/manifest.webmanifest",
]);

self.addEventListener("install", () => {
  self.skipWaiting();
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

function isCacheable(url) {
  if (url.origin !== self.location.origin) return false;
  if (STATIC_EXACT.has(url.pathname)) return true;
  return STATIC_PREFIXES.some((p) => url.pathname.startsWith(p));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (!isCacheable(url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        if (cached) return cached;
        throw err;
      }
    })(),
  );
});
