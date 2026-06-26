const CACHE_NAME = 'music-player-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
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
  // Simple network-first fallback to cache strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, clone and store in cache
        if (response.status === 200) {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
