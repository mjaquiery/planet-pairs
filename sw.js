// Generated at build time.
const VERSION = "7f4fbbcad342";
const FILES = ["./","assets/index-BjBlrHJj.css","assets/index-DGgZ8ayd.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon.svg","index.html","manifest.webmanifest","photos/earth-1.jpg","photos/earth-2.png","photos/earth-3.jpg","photos/jupiter-1.jpg","photos/jupiter-2.jpg","photos/jupiter-3.jpg","photos/mars-1.jpg","photos/mars-2.jpg","photos/mars-3.jpg","photos/mercury-1.jpg","photos/mercury-2.jpg","photos/mercury-3.jpg","photos/moon-1.jpg","photos/moon-2.jpg","photos/moon-3.jpg","photos/neptune-1.jpg","photos/neptune-2.jpg","photos/saturn-1.jpg","photos/saturn-2.jpg","photos/saturn-3.jpg","photos/sun-1.jpg","photos/sun-2.jpg","photos/sun-3.jpg","photos/uranus-1.jpg","photos/uranus-2.jpg","photos/uranus-3.png","photos/venus-1.jpg","photos/venus-2.jpg"];
const SCOPE = new URL(self.registration.scope);
const CACHE = 'planet-pairs:' + SCOPE.pathname + ':' + VERSION;
const STAGE = SCOPE.pathname + 'stage/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new URL(f, SCOPE).href))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const prefix = 'planet-pairs:' + SCOPE.pathname + ':';
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(prefix) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (url.pathname.startsWith(STAGE)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = req.mode === 'navigate' ? new URL('./', SCOPE).href : url.href.split('#')[0];
      const hit = await cache.match(key, { ignoreSearch: true });
      if (hit) return hit;
      try {
        return await fetch(req);
      } catch (err) {
        const fallback = await cache.match(new URL('./', SCOPE).href);
        if (fallback) return fallback;
        throw err;
      }
    }),
  );
});
