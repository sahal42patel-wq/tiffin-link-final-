const CACHE_NAME = 'tiffinlink-offline-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vendor/tailwindcss.js',
  '/fonts/google-fonts.css',
  '/fonts/material-symbols.css',
  '/assets/indian_tiffin_heritage.png',
  '/assets/food_biryani.png',
  '/assets/food_burger.png',
  '/assets/food_coffee.png',
  '/assets/food_dessert.png',
  '/assets/food_pizza.png',
  '/assets/food_south_indian.png',
  '/assets/food_vada.png',
  '/assets/food_vada_pav.png',
  '/assets/provider_1.png',
  '/assets/provider_2.png',
  '/assets/provider_3.png',
  '/assets/provider_4.png',
  '/assets/provider_5.png',
  '/assets/tiffin_hero.png',
  '/assets/dashboard_mockup.png',
  '/assets/phone_mockup.png',
  '/assets/qr_code.png',
  '/assets/becomedeliveryform.jpg',
  '/favicon.svg',
  '/icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Pre-cache skipped for ${asset}:`, err.message);
          })
        )
      );
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

  // STRICT SECURITY & ACCURACY RULES:
  // Never cache or intercept non-GET, API endpoints, socket.io, auth or web sockets
  if (
    req.method !== 'GET' ||
    url.protocol.startsWith('ws') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.hostname !== location.hostname
  ) {
    return;
  }

  // 1. Navigation requests (HTML page / App shell)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 2. Static Assets (Fonts, CSS, JS bundles, Images)
  // Stale-While-Revalidate with graceful offline fallbacks
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for failed image requests when offline
        if (req.destination === 'image' || req.headers.get('accept')?.includes('image/')) {
          return caches.match('/assets/indian_tiffin_heritage.png');
        }
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
