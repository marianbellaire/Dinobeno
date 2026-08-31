// Einfacher Service Worker für Offline-Spielbarkeit (Phase 6). Statt einer festen
// Liste an vorzucachenden Dateien (deren Namen sich bei jedem Next.js-Build durch
// Content-Hashes ändern) wird "on the fly" gecacht: jede erfolgreiche Antwort landet
// automatisch im Cache, offline wird aus diesem Cache bedient.
const CACHE_NAME = "dino-be-no-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first: online immer die aktuellste Version laden (und cachen), offline
  // bzw. bei Netzwerkfehler aus dem Cache bedienen. Fällt das auch ins Leere (noch
  // nie geladene Seite), zumindest die App-Shell ("/") als letzten Ausweg liefern.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
  );
});
