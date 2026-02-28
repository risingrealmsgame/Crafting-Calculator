/* Rising Realms Crafting Calculator - Service Worker (GitHub Pages friendly) */

const CACHE_VERSION = "rr-craft-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/**
 * Cache strategy:
 * - Same-origin GET: cache-first, then network, update cache
 * - Anything else: network
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only handle same-origin requests (GitHub Pages safe)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        // Only cache successful, basic responses
        if (fresh && fresh.ok && fresh.type === "basic") {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        // If offline and we didn't have it cached, try serving the app shell
        const fallback = await cache.match("./index.html");
        return fallback || new Response("Offline.", { status: 503 });
      }
    })()
  );
});
