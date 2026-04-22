const CACHE_NAME = 'horizon-hotels-v1.2.0';
const STATIC_CACHE = 'horizon-static-v1.2.0';
const DYNAMIC_CACHE = 'horizon-dynamic-v1.2.0';
const API_CACHE = 'horizon-api-v1.2.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// API endpoints to cache with different strategies
const CACHEABLE_API_PATTERNS = [
  /^\/api\/hotels\//,
  /^\/api\/recommendations/,
  /^\/api\/map\/heatmap/,
  /^\/api\/map\/price-overlays/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Handle different types of requests
  if (url.origin === self.location.origin) {
    // Static assets - cache first strategy
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/icons/')) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    // HTML pages - network first strategy
    else if (url.pathname.endsWith('.html') || url.pathname === '/') {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    }
    // Other static resources - stale while revalidate
    else {
      event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    }
  } else if (url.pathname.startsWith('/api/')) {
    // API requests with different strategies
    if (CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      event.respondWith(staleWhileRevalidate(request, API_CACHE, 5 * 60 * 1000)); // 5 minutes
    } else {
      event.respondWith(networkOnly(request));
    }
  } else {
    // External resources - cache first with network fallback
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
  }
});

// Caching strategies
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return getOfflineResponse(request);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineResponse(request);
  }
}

async function staleWhileRevalidate(request, cacheName, maxAge = 24 * 60 * 60 * 1000) {
  try {
    const cachedResponse = await caches.match(request);
    
    // Check if cached response is still valid
    if (cachedResponse) {
      const dateHeader = cachedResponse.headers.get('date');
      if (dateHeader) {
        const cachedTime = new Date(dateHeader).getTime();
        const now = Date.now();
        if (now - cachedTime < maxAge) {
          // Revalidate in background
          fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              const cache = caches.open(cacheName);
              cache.then(c => c.put(request, networkResponse));
            }
          }).catch(() => {}); // Ignore network errors for background fetch
          
          return cachedResponse;
        }
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Stale while revalidate failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineResponse(request);
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Network only failed:', error);
    return getOfflineResponse(request);
  }
}

async function getOfflineResponse(request) {
  if (request.destination === 'document') {
    // Return offline page for HTML requests
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Return a basic offline response
  return new Response(
    JSON.stringify({ 
      error: 'Offline', 
      message: 'No internet connection available' 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  } else if (event.tag === 'sync-wishlist') {
    event.waitUntil(syncWishlist());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'You have new booking updates!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Booking',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification('Horizon Hotels', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/bookings')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync:', event.tag);
  
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

// Sync functions
async function syncBookings() {
  try {
    // Get offline bookings from IndexedDB
    const offlineBookings = await getOfflineBookings();
    
    for (const booking of offlineBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${booking.token}`
          },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineBooking(booking.id);
        }
      } catch (error) {
        console.error('Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.error('Sync bookings failed:', error);
  }
}

async function syncWishlist() {
  try {
    // Get offline wishlist actions from IndexedDB
    const offlineActions = await getOfflineWishlistActions();
    
    for (const action of offlineActions) {
      try {
        const response = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${action.token}`
          },
          body: JSON.stringify({ hotelId: action.hotelId })
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflineWishlistAction(action.id);
        }
      } catch (error) {
        console.error('Failed to sync wishlist action:', error);
      }
    }
  } catch (error) {
    console.error('Sync wishlist failed:', error);
  }
}

async function updateCache() {
  try {
    // Update frequently used API endpoints
    const cache = await caches.open(API_CACHE);
    
    // Cache hotel search results
    const searchResponse = await fetch('/api/hotels?limit=10');
    if (searchResponse.ok) {
      await cache.put('/api/hotels?limit=10', searchResponse);
    }
    
    // Cache recommendations
    const recResponse = await fetch('/api/recommendations');
    if (recResponse.ok) {
      await cache.put('/api/recommendations', recResponse);
    }
  } catch (error) {
    console.error('Cache update failed:', error);
  }
}

// IndexedDB helpers (simplified for this example)
async function getOfflineBookings() {
  // In a real implementation, this would interact with IndexedDB
  return [];
}

async function removeOfflineBooking(id) {
  // Remove from IndexedDB
}

async function getOfflineWishlistActions() {
  // Get from IndexedDB
  return [];
}

async function removeOfflineWishlistAction(id) {
  // Remove from IndexedDB
}
