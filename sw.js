/* Barkley/sw.js — retires the service worker from the previous Barkley app.
   The old worker cached the old pages for offline use. This version deletes those
   caches, unregisters itself and reloads any open Barkley tabs, so everyone lands
   on the current page. It has no fetch handler, so it never intercepts requests. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf('barkley-') === 0; })
          .map(function (k) { return caches['delete'](k); }));
      })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) { clients.forEach(function (c) { c.navigate(c.url); }); })
  );
});
