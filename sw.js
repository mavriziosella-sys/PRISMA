// Prisma: keeps the app usable offline.
// Serves the saved copy first, refreshes it in the background: a new version appears at the next launch.
const CACHE = "prisma-v19";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const fresh = fetch(req)
    .then(async (res) => {
      if (res && res.ok) {
        const c = await caches.open(CACHE);
        await c.put(req, res.clone());
      }
      return res;
    })
    .catch(() => null);
  e.waitUntil(fresh.then(() => undefined));

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const cached = await c.match(req, { ignoreSearch: true });
    if (cached) return cached;
    const res = await fresh;
    if (res) return res;
    if (req.mode === "navigate") {
      const shell = (await c.match("./index.html")) || (await c.match("./"));
      if (shell) return shell;
    }
    return Response.error();
  })());
});
