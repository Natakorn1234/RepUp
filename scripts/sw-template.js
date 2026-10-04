self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll(ASSETS);
      // Media is optional: one missing illustration must never block app installation.
      await Promise.allSettled(MEDIA.map((url) => c.add(url)));
    }),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("repup-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (
        new URL(event.request.url).pathname.startsWith("/_next/static/") ||
        new URL(event.request.url).pathname.startsWith("/exercises/")
      ) {
        const hit = await cache.match(event.request);
        if (hit) return hit;
      }
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch {
        return (
          (await cache.match(event.request)) ||
          (event.request.mode === "navigate" ? await cache.match("/") : null) ||
          Response.error()
        );
      }
    })(),
  );
});
