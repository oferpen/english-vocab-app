// Service Worker for EnglishPath PWA
const CACHE_NAME = 'englishpath-v2'; // Increment version to clear old cache
const urlsToCache = [
  // Don't cache '/' since it redirects - cache the actual destination instead
  '/learn/path',
  '/favicon.png',
  '/apple-touch-icon.png',
];

// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  // Skip caching in development mode
  if (isDevelopment) {
    console.log('Service Worker: Skipping cache in development mode');
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Use add() instead of addAll() to handle redirects individually
        return Promise.all(
          urlsToCache.map((url) => 
            cache.add(url).catch((error) => {
              console.log(`Failed to cache ${url}:`, error);
            })
          )
        );
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip caching in development mode - always fetch from network
  if (isDevelopment) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API routes and external requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('db.prisma.io') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request, {
          redirect: 'follow' // Allow following redirects
        }).then((response) => {
          // Don't cache redirects (3xx status codes)
          if (response.status >= 300 && response.status < 400) {
            return response; // Return redirect response without caching
          }

          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});
