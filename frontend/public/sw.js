const CACHE_NAME = "quickcart-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
];
 
// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});
 
// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});
 
// Fetch: network-first for API, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
 
  // Always network for API calls
  if (url.pathname.startsWith("/api")) {
    event.respondWith(fetch(request));
    return;
  }
 
  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((response) => {
        // Cache successful GET responses
        if (request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
    )
  );
});
 
// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "QuickCart", {
      body:    data.body || "You have a new notification",
      icon:    "/icon-192.png",
      badge:   "/badge-72.png",
      tag:     data.tag || "quickcart-notif",
      data:    data.url ? { url: data.url } : {},
      vibrate: [200, 100, 200],
    })
  );
});
 
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const existing = clientList.find((c) => c.url === url && c.focus);
      return existing ? existing.focus() : clients.openWindow(url);
    })
  );
});