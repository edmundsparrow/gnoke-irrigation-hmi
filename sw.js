const CACHE_NAME = 'gnoke-irrigation-v1';

const ASSETS = [
  './',
  './index.html',
  './main/',
  './main/index.html',
  './style.css',
  './global.png',
  './manifest.json',
  './js/state.js',
  './js/theme.js',
  './js/ui.js',
  './js/update.js',
  './js/app.js',
  './js/connections.js',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
