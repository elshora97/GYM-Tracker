/* Gym Tracker service worker — offline app shell.
 *
 * - App routes are pre-cached on install (and re-warmed on every app start while
 *   online) together with every /_next/static asset they reference.
 * - Navigations: network-first, falling back to the cached page, then to "/".
 * - /_next/static/*: cache-first (file names are content-hashed, so immutable).
 * - Other same-origin GETs (icons, manifest, fonts): stale-while-revalidate.
 * - RSC data requests are never served from cache: if they fail, the Next.js
 *   router falls back to a full navigation, which is served from the page cache.
 *
 * Workout data itself lives in IndexedDB and never touches the network.
 */
const VERSION = "v1";
const PAGES_CACHE = `gt-pages-${VERSION}`;
const STATIC_CACHE = "gt-static";
const RUNTIME_CACHE = `gt-runtime-${VERSION}`;
const KEEP = [PAGES_CACHE, STATIC_CACHE, RUNTIME_CACHE];

const ROUTES = [
  "/",
  "/workout",
  "/workout/complete",
  "/exercises",
  "/exercises/detail",
  "/history",
  "/history/detail",
  "/settings",
];
const ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const STATIC_RE = /\/_next\/static\/[^"'\s)\\]+/g;

async function cacheRoute(route) {
  const res = await fetch(route, { cache: "no-store", credentials: "same-origin" });
  if (!res.ok || res.redirected) return;
  const html = await res.clone().text();
  const pages = await caches.open(PAGES_CACHE);
  await pages.put(route, res);
  const assets = Array.from(new Set(html.match(STATIC_RE) || []));
  await cacheStatic(assets);
}

async function cacheStatic(urls) {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(
    urls.map(async (url) => {
      try {
        if (await cache.match(url)) return;
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      } catch {
        /* ignore individual failures */
      }
    }),
  );
}

async function warm() {
  await Promise.all(ROUTES.map((r) => cacheRoute(r).catch(() => {})));
  const runtime = await caches.open(RUNTIME_CACHE);
  await Promise.all(ASSETS.map((a) => runtime.add(a).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(warm().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "WARM") event.waitUntil(warm());
  if (data.type === "CACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(cacheStatic(data.urls.filter((u) => typeof u === "string" && u.includes("/_next/static/"))));
  }
});

function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

async function handleNavigation(event) {
  const url = new URL(event.request.url);
  const pages = await caches.open(PAGES_CACHE);
  try {
    const preload = await event.preloadResponse;
    const res = preload || (await fetch(event.request));
    if (res.ok && res.type === "basic") pages.put(url.pathname, res.clone());
    return res;
  } catch {
    return (
      (await pages.match(url.pathname)) ||
      (await pages.match(url.pathname.replace(/\/$/, ""))) ||
      (await pages.match("/")) ||
      new Response("<h1>Offline</h1><p>Open the app once while online to enable offline mode.</p>", {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(event.request);
  const network = fetch(event.request)
    .then((res) => {
      if (res.ok && res.type === "basic") cache.put(event.request, res.clone());
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(network);
    return hit;
  }
  return (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }
  if (isRscRequest(request, url)) return; // network only — see header comment
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname.startsWith("/_next/")) return; // dev/HMR and other internals
  event.respondWith(staleWhileRevalidate(event));
});
