const CACHE_NAME = 'water-tracker-v1';

const base = self.location.pathname.replace(/\/[^\/]*$/, '/');

const urlsToCache = [
  `${base}`,
  `${base}index.html`,
  `${base}login.html`,
  `${base}style.css`,
  `${base}script.js`,
  `${base}firebase-init.js`,
  `${base}manifest.json`,
  `${base}icons/icon-192.png`,
  `${base}icons/icon-512.png`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() =>
          new Response('Offline or network error', {
            status: 503,
            statusText: 'Offline'
          })
        )
      );
    })
  );
});
