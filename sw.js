// MEGAGEN Quote PWA service worker
const CACHE = "mgquote-v2-1";
const ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Never cache Google Apps Script calls (cloud save) — always go to network.
  if (req.url.includes("script.google.com") || req.url.includes("script.googleusercontent.com")) {
    return; // let it hit the network normally
  }
  // Cache-first for same-origin GET; fall back to network, then cache the response.
  if (req.method === "GET") {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          // cache successful same-origin responses
          if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => caches.match("./index.html"));
      })
    );
  }
});
