// Bump this whenever index.html/manifest/icons change, so installed
// iOS home-screen apps pick up the update instead of serving stale cache.
const CACHE_VERSION = 'field-log-v24';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-180-v2.png',
  './icons/icon-180-dark-v2.png',
  './icons/icon-192-v2.png',
  './icons/icon-512-v2.png'
];

// cache: 'reload' forces a true network round-trip, bypassing the browser's
// own HTTP cache layer -- without this, a "fresh" fetch can still resolve to
// a stale HTTP-cached response (e.g. during CDN edge propagation right after
// a deploy), which then gets written into our Cache API storage and never
// self-heals on subsequent background revalidations.
function networkFetch(url) {
  return fetch(url, { cache: 'reload' });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          networkFetch(url)
            .then((response) => {
              if (response.ok) return cache.put(url, response);
            })
            .catch(() => {})
        )
      )
    )
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
          networkFetch(event.request.url)
            .then((response) => {
              if (response.ok) {
                return caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response));
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      return networkFetch(event.request.url)
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
