// Service worker: deixa o app abrir mesmo sem internet.
// Os dados em si ficam no cache offline do Firestore.
// Ao atualizar o app, troque o número da versão abaixo (v1 -> v2).
const CACHE = 'financas-v6';
const SHELL = ['./', './index.html', './firebase-config.js', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const cacheable = u.origin === location.origin ||
    u.hostname === 'www.gstatic.com' ||
    u.hostname === 'fonts.googleapis.com' ||
    u.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;           // Firestore e Auth passam direto
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
  );
});
