// TeamSync service worker.
//
// Strategy
//  - Navigations: network-first, falling back to /offline.html when the network is unavailable.
//  - Hashed build assets (/assets/*): cache-first (file names change whenever content changes).
//  - Other same-origin static files (icons, manifest): stale-while-revalidate.
//  - Never handled here: non-GET requests, cross-origin requests (Firebase APIs), /api/* and
//    Firebase Hosting reserved paths (/__/*, used by Auth action links). Live data and
//    authentication responses are never cached.
//
// Updates: a new worker waits until the page asks it to activate (SKIP_WAITING), so users are not
// reloaded in the middle of editing a form.

const CACHE_VERSION = 'v3';
const CACHE_NAME = `teamsync-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/offline.css',
  '/offline.js',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('teamsync-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

function shouldHandle(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/')) return false;
  // Connectivity probes (offline page) must always reach the network, never the cache.
  if (url.searchParams.has('sw-bypass')) return false;
  return true;
}

async function putIfCacheable(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
}

async function handleNavigation(event) {
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(event.request));
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const offline = await cache.match(OFFLINE_URL);
    return offline || new Response('You are offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await putIfCacheable(request, response);
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      await putIfCacheable(request, response);
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const response = await refresh;
  return response || new Response('', { status: 504, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!shouldHandle(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  const { pathname } = new URL(request.url);
  event.respondWith(
    pathname.startsWith('/assets/') ? cacheFirst(request) : staleWhileRevalidate(request),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
