/* ============================================================
   LifeFlow — Service Worker (Offline Engine & Background Notifications)
   Production-Ready: Relative Base Support + Google Fonts Caching
   ============================================================ */
'use strict';

const CACHE_VERSION = 'lifeflow-v2.1.0';
const STATIC_CACHE = CACHE_VERSION + '-static';
const FONT_CACHE = 'lifeflow-fonts-v1';

// Calculate relative base URL dynamically from Service Worker location
const BASE_PATH = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);

const PRECACHE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.webmanifest',
  BASE_PATH + 'favicon.svg',
  BASE_PATH + 'google-config.js',
  BASE_PATH + 'icons/icon-192.png',
  BASE_PATH + 'icons/icon-512.png',
  BASE_PATH + 'icons/maskable-512.png',
  BASE_PATH + 'icons/apple-touch-icon.png',
  BASE_PATH + 'audio/chime.mp3',
  BASE_PATH + 'audio/bell.mp3',
  BASE_PATH + 'audio/alert.mp3',
  BASE_PATH + 'audio/chime.wav',
  BASE_PATH + 'audio/bell.wav',
  BASE_PATH + 'audio/alert.wav'
];

/* Install Event — Resilient Pre-cache App Shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async (cache) => {
        console.log('[SW] Pre-caching offline app shell & ringtones at base:', BASE_PATH);
        const cachePromises = PRECACHE_ASSETS.map(async (assetUrl) => {
          try {
            const response = await fetch(assetUrl);
            if (response && response.ok) {
              await cache.put(assetUrl, response);
            }
          } catch (e) {
            console.warn('[SW] Optional pre-cache skipped:', assetUrl);
          }
        });
        await Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
        return self.skipWaiting();
      })
  );
});

/* Activate Event — Clean up stale caches & claim clients */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('lifeflow-') && k !== STATIC_CACHE && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      );
    })()
  );
});

/* Notification Click Event — Deep Linking & Actions (Done / Snooze) */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // 1. Handle "Done" Action (Mark item completed)
      if (action === 'done') {
        console.log('[SW] Notification action: DONE for reminder:', data.reminderId);
        allClients.forEach((client) => {
          client.postMessage({
            type: 'REMINDER_DONE',
            reminderId: data.reminderId
          });
        });
        return;
      }

      // 2. Handle "Snooze" Action (Postpone for 10 minutes)
      if (action === 'snooze') {
        console.log('[SW] Notification action: SNOOZE for reminder:', data.reminderId);
        allClients.forEach((client) => {
          client.postMessage({
            type: 'REMINDER_SNOOZE',
            reminderId: data.reminderId,
            minutes: 10
          });
        });
        return;
      }

      // 3. Regular Click on Notification Body — Focus or Open LifeFlow
      const targetUrl = data.url || BASE_PATH;

      if (allClients.length > 0) {
        const client = allClients[0];
        await client.focus();
        client.postMessage({
          type: 'NAVIGATE_TO',
          url: targetUrl
        });
        return;
      }

      // Open new window if none is running
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});

/* Message Listener — Commands from Main Thread */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Trigger notification directly from Service Worker
  if (event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

/* Fetch Event — Hybrid Cache-First Strategy with Font Caching */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Google Fonts Cache Strategy (Cache-First)
  const FONT_ORIGINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
  if (FONT_ORIGINS.includes(url.hostname)) {
    event.respondWith(
      (async () => {
        const fontCache = await caches.open(FONT_CACHE);
        const cachedFont = await fontCache.match(req);
        if (cachedFont) return cachedFont;

        try {
          const freshFont = await fetch(req);
          if (freshFont && freshFont.ok) {
            fontCache.put(req, freshFont.clone());
          }
          return freshFont;
        } catch (err) {
          // Graceful fallback for offline mode without unhandled console errors
          return cachedFont || new Response('', {
            headers: { 'Content-Type': req.destination === 'font' ? 'font/woff2' : 'text/css' }
          });
        }
      })()
    );
    return;
  }

  // Ignore other external third-party origins
  if (url.origin !== self.location.origin) return;

  // 2. Navigation requests: Network-First with Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(req, networkResponse.clone());
            cache.put(BASE_PATH + 'index.html', networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(STATIC_CACHE);
          const cachedIndex =
            (await cache.match(req)) ||
            (await cache.match(BASE_PATH + 'index.html')) ||
            (await cache.match(BASE_PATH)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/'));
          if (cachedIndex) return cachedIndex;

          return new Response(
            `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>LifeFlow — أوفلاين</title></head><body style="font-family:system-ui;text-align:center;padding:50px;"><h2>أنت تعمل دون اتصال بالإنترنت</h2><p>تطبيق LifeFlow متاح للعمل أوفلاين بالكامل.</p></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // 3. Static Assets & Audio: Cache-First
  const isStatic =
    url.pathname.includes('/src/') ||
    url.pathname.includes('/assets/') ||
    url.pathname.includes('/icons/') ||
    url.pathname.includes('/audio/') ||
    url.pathname.includes('/@') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.webmanifest');

  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(req);
        if (cached) {
          fetch(req).then((fresh) => {
            if (fresh && fresh.ok) cache.put(req, fresh.clone());
          }).catch(() => {});
          return cached;
        }

        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) {
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (err) {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // 4. General fallback
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
