const CACHE = 'masrouf-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './sms-parser.js', './fonts.css', './fonts/plex-arabic-400.woff2', './fonts/plex-arabic-500.woff2', './fonts/plex-arabic-600.woff2', './fonts/plex-arabic-700.woff2', './fonts/plex-latin-400.woff2', './fonts/plex-latin-700.woff2', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r && r.status === 200) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
