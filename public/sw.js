// Service worker mínimo do Dedetech — torna o app instalável (PWA).
// A fila offline completa (IndexedDB + Background Sync da ficha de campo)
// entra como camada final — ver docs/pwa-offline.md.

const CACHE = "dedetech-v1";
const SHELL = ["/dashboard", "/os", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// Network-first para navegação; cai no cache do shell quando offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/dashboard")),
    );
  }
});
