/**
 * Chinese Game 2.0 - Service Worker
 * Provides offline caching for seamless iPad practice.
 * Hardened to ensure local assets always cache reliably even if external CDNs are unavailable.
 */

const CACHE_NAME = 'chinese-game-v2-cache-v2';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/theme-minecraft.css',
  './css/theme-space.css',
  './js/engine.js',
  './js/adapter.js',
  './js/questions_default.js',
  './js/modules/recognition.js',
  './js/modules/handwriting.js',
  './js/modules/reading.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const EXTERNAL_ASSETS = [
  'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Core local assets MUST be cached successfully
      await cache.addAll(LOCAL_ASSETS);

      // 2. Cache external CDN assets resiliently without failing the install Promise
      for (const url of EXTERNAL_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('External asset caching deferred until online:', url);
        }
      }
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
  // Pass through cloud WebApp API calls dynamically
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
