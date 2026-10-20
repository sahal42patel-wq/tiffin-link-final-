const CACHE_NAME = 'tiffinlink-offline-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/vendor/tailwindcss.js',
  '/fonts/google-fonts.css',
  '/fonts/material-symbols.css',
  '/assets/indian_tiffin_heritage.png',
  '/assets/food_biryani.png',
  '/favicon.svg',
  '/icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Non-critical pre-cache issue:', err);
      });
    }).then(() => self.skipWaiting())
  );
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and chrome-extension / socket / API requests
  if (req.method !== 'GET' || url.protocol.startsWith('ws') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Stale-while-revalidate for local static assets (fonts, vendor scripts, images, CSS)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        }).catch(() => {
          // If offline and request is an image, fall back to cached placeholder
          if (req.destination === 'image' || req.headers.get('accept')?.includes('image/')) {
            return caches.match('/assets/indian_tiffin_heritage.png');
          }
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // External font or CDN assets (if any remaining) - Cache First
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => {
        if (req.destination === 'image') {
          return caches.match('/assets/indian_tiffin_heritage.png');
        }
      });
    })
  );
});
