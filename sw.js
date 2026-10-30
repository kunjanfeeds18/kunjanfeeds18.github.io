/* JRRefractory — minimal offline service worker.
   Precaches the app shell; runtime-caches everything else (cache-first, falls back to network). */
const CACHE = "jrr-v2"; // bump together with ASSET_VERSION in build/site-config.mjs
const PRECACHE = [
  "/",
  "/css/styles.min.css?v=2",
  "/js/main.min.js?v=2",
  "/fonts/inter-400.woff2",
  "/fonts/montserrat-700.woff2",
  "/images/favicon-192.png",
  "/404.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/404.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && new URL(req.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
