// Resilient Service Worker for UNIMAID Business Administration PWA
const CACHE_NAME = 'unimaid-busadmin-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Safely cache each asset without breaking entire installation on single 404
      return Promise.allSettled(
        CORE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`PWA Cache asset skipped: ${asset}`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never cache APK download requests in SW cache
  if (event.request.url.endsWith('.apk')) {
    return;
  }

  // Handle GET requests with network-first or cache fallback
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback to index
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('./index.html') || caches.match('./');
            }
          });
      })
    );
  }
});
