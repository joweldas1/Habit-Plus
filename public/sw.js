// Simple Service Worker for HabitPlus PWA
const CACHE_NAME = 'habitplus-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through fetch; LocalStorage persists user data
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
