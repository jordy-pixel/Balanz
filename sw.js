// Balanz — minimale service worker
// Doel: de app installeerbaar maken als "app-icoon" op het startscherm,
// en de laatst geladen pagina snel tonen bij een herbezoek.
// Bewust eenvoudig: geen aparte offline-modus voor live data (die komt toch
// van Supabase en moet actueel blijven), enkel de app-schil zelf.

const CACHE_NAME = 'balanz-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Enkel de eigen app-pagina cachen (GET, same-origin, navigatie/HTML).
  // Alle Supabase-aanroepen en andere requests gaan gewoon rechtstreeks naar het netwerk.
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin){
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
