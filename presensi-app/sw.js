const CACHE_NAME = "presensi-v1";

const FILES = [
  "/presensi-app/",
  "/presensi-app/index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", (event) => {

  event.respondWith(
    fetch(event.request)
      .then(response => {

        const clone = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, clone));

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(res => {
            return res || caches.match("/presensi-app/offline.html");
          });
      })
  );

});