const CACHE_NAME = 'presensi-cache-v1';
const ASSETS = [
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/db-adapter.js',
  './js/auth.js',
  './js/scanner.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first untuk API (data harus selalu terbaru), cache-first untuk file statis
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});