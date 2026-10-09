// Canalboater Sim service worker — cache-first offline support
const CACHE = 'cbs-v2.7-mv0vz0wn';
const FILES = ['./', './index.html', './game.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
const MCACHE = 'cbs-music-v1'; // music tracks are cached as they are first played and kept across game updates
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== MCACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
async function music(req) {
  const url = new URL(req.url); const key = url.origin + url.pathname; const c = await caches.open(MCACHE);
  let r = await c.match(key);
  if (!r) { try { const full = await fetch(key); if (!full.ok) return full; await c.put(key, full.clone()); r = full; } catch (err) { return fetch(req); } }
  const range = req.headers.get('range'); if (!range) return r;
  const buf = await r.arrayBuffer(); const m = /bytes=(d*)-(d*)/.exec(range) || []; const size = buf.byteLength;
  let a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1; if (!m[1] && m[2]) { a = size - +m[2]; b = size - 1; } b = Math.min(b, size - 1);
  return new Response(buf.slice(a, b + 1), { status: 206, headers: { 'Content-Type': 'audio/mpeg', 'Content-Range': 'bytes ' + a + '-' + b + '/' + size, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/music/') && e.request.url.endsWith('.mp3')) { e.respondWith(music(e.request)); return; }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((resp) => { const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return resp; }).catch(() => caches.match('./index.html'))));
});
