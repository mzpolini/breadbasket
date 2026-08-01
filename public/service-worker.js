const CACHE_NAME = 'breadbasket-v1'
const STATIC_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
]

// Install: cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache essentials; if icons don't exist yet, that's fine
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently continue if some static assets don't exist yet
      })
    }),
  )
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Fetch: network-first strategy (always try network, fall back to cache)
self.addEventListener('fetch', (event) => {
  // Don't cache non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip browser extensions and other non-http(s) schemes
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone the response before caching
        const responseToCache = response.clone()

        // Cache GET requests (except API calls to /api/chat)
        if (
          event.request.method === 'GET' &&
          !event.request.url.includes('/api/chat')
        ) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
      .catch(() => {
        // Fall back to cache when network fails
        return caches.match(event.request)
      }),
  )
})
