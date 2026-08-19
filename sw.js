// Bump this whenever index.html/manifest/icons change, so installed
// iOS home-screen apps pick up the update instead of serving stale cache.
const CACHE_VERSION = 'field-log-v14';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-180-v2.png',
  './icons/icon-180-dark-v2.png',
  './icons/icon-192-v2.png',
  './icons/icon-512-v2.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // serve cached copy instantly, refresh cache in the background
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (response.ok) {
                return caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response));
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
