// sw.js

self.addEventListener('install', (event) => {
    // Pre-cache static assets
    event.waitUntil(
      caches.open('static-cache-v1').then((cache) => {
        return cache.addAll([
          '/', // Cache the root page
          '/index.html',
          '/styles.css',
          '/script.js',
          // Add other assets you want to cache
        ]);
      })
    );
    console.log('Service Worker installed');
  });
  
  self.addEventListener('activate', (event) => {
    // Clean up old caches
    const cacheWhitelist = ['static-cache-v1'];
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
    console.log('Service Worker activated');
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  