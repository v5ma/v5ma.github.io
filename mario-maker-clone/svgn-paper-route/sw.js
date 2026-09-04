/* =========================================================================
   SVGN Paper Route service worker.

   NETWORK-FIRST for the page and the game data, cache-first only for things
   that never change (icons, the manifest). The old worker was cache-first for
   everything, which meant a returning player kept getting the previously
   installed build no matter how many times they reloaded — the single most
   persistent bug in this project. Offline still works: the cache is the
   fallback, not the default.
   ========================================================================= */
const CACHE = 'svgn-paper-route-delivery-20260904';

/* only genuinely static things get served from cache first */
const STATIC = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC).catch(() => {}))
      .then(() => self.skipWaiting())          /* take over immediately */
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('svgn-paper-route-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())        /* control open tabs right away */
  );
});

const isStatic = url =>
  /\.(png|webmanifest|ico|svg)$/i.test(url.pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   /* let cross-origin go straight out */

  if (isStatic(url)) {
    /* icons and the manifest: cache-first is safe, they do not change */
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  /* everything else — the page, the module, the voxel assets, three.js —
     comes from the network when the network is there */
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});

/* a page can tell this worker to step aside entirely */
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
