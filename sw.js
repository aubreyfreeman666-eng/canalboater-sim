// Canalboater Sim service worker — cache-first offline support
const CACHE = 'cbs-v2.1-mv0b53bl';
const FILES = ['./', './index.html', './game.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((resp) => { const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return resp; }).catch(() => caches.match('./index.html'))));
});
