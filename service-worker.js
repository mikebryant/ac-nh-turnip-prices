// PWA Code adapted from https://github.com/pwa-builder/PWABuilder
const CACHE = "pwa-precache-v1";
const precacheFiles = [
  "/index.html",
  "/js/predictions.js",
  "/js/scripts.js",
  "/css/styles.css",
  "https://code.jquery.com/jquery-3.4.1.min.js",
];

self.addEventListener("install", function (event) {
  console.log("[PWA] Install Event processing");

  console.log("[PWA] Skip waiting on install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA] Caching pages during install");
      return cache.addAll(precacheFiles);
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA] Claiming clients for current page");
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      let response;
      try {
        // Fetch from network first.
        response = await fetch(event.request);
        event.waitUntil(updateCache(event.request, response.clone()));
      } catch (error) {
        try {
          // Try if there's locally cached version.
          response = await fromCache(event.request);
        } catch (error) {
          console.log("[PWA] Network request failed and no cache." + error);
          throw error;
        }
      }
      return response;
    })()
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
