// Offline support: pages and data from the network when possible, otherwise from cache.
const CACHE = 'france-2027-v1';
const PRECACHE = ['/', '/manifest.webmanifest', '/icon-192.png',
  '/art/paris.svg', '/art/disney.svg', '/art/beauval.svg', '/art/loire.svg', '/art/lacanau.svg',
  '/art/rochelle.svg', '/art/granville.svg', '/art/ferry.svg', '/art/map.svg', '/art/ferrymap.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c => c.put('/', res.clone())); return res; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
