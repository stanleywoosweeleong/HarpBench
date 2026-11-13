/* Harp Bench service worker: caches the whole app so it plays offline.
   Bump VERSION whenever any file changes so installed copies update. */
const VERSION = 'harpbench-v1.13.2';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'songs.js',
  'js/core.js',
  'js/i18n.js',
  'js/pitch.js',
  'js/theory.js',
  'js/abc.js',
  'js/harp.js',
  'js/pocket.js',
  'js/metronome.js',
  'js/songbook.js',
  'js/transport.js',
  'js/mic.js',
  'js/sampler.js',
  'js/main.js',
  'pwa.js',
  'manifest.webmanifest',
  'fonts/fonts.css',
  'fonts/BigShouldersDisplay-600.woff2',
  'fonts/IBMPlexMono-400.woff2',
  'fonts/IBMPlexMono-600.woff2',
  'fonts/IBMPlexSans-400.woff2',
  'icons/icon.svg',
  'icons/icon-32.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  // cache: 'reload' skips the browser's HTTP cache, so an update never stores an older copy of a file
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      // Cache Storage is shared by every app on stanleywoosweeleong.github.io: delete only Harp Bench's old caches
      .then(keys => Promise.all(keys.filter(k => k.startsWith('harpbench-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Everything comes from this release's own cache, so the page and its scripts always match. A new release is
  // fetched by the next service worker and takes over when the player taps Update. (caches.match() on its own would
  // also search other apps' caches on this domain.)
  const fromRelease = key => caches.open(VERSION).then(c => c.match(key, { ignoreSearch: true }));
  if (req.mode === 'navigate') {
    event.respondWith(fromRelease('index.html').then(hit => hit || fetch(req)));
    return;
  }
  event.respondWith(fromRelease(req).then(hit => hit || fetch(req)));
});
