/* BONES service worker: network first, cache as a fallback for offline use.
   Same-origin pages: network first, so testers always get the newest version.
   Libraries and fonts from the CDNs the pages use: cache first. Their URLs are pinned to a
   version, so a cached copy never goes stale, and pages that need three.js keep working
   offline once they have been opened. */
const CACHE = 'bones-v3';
const CDN = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (!CDN.includes(url.hostname)) return;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })());
    return;
  }
  event.respondWith((async () => {
    try {
      // Pages ask the server whether they changed instead of trusting the browser's copy, which
      // GitHub Pages allows to be up to 10 minutes old. Testers see a fix as soon as it is live.
      const res = req.mode === 'navigate' ? await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : await fetch(req);
      // A page fetched this way may have followed a redirect (move → move/); browsers refuse to
      // show a redirected response for a navigation, so pass the redirect on instead.
      if (req.mode === 'navigate' && res.redirected) return Response.redirect(res.url, 302);
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const home = await caches.match(new URL('./', self.registration.scope).href);
        if (home) return home;
      }
      throw err;
    }
  })());
});
