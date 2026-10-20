/* Service worker : l'appli marche hors ligne. Changer VERSION à chaque mise à jour. */
const VERSION = "ecole-2026-10-20e";
const CORE = ["./", "index.html", "app.enc", "manifest.webmanifest", "icons/icon-192.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.endsWith(".ics")) return; // toujours depuis le réseau
  // réseau d'abord pour nos fichiers (mises à jour immédiates), cache en secours ; cache d'abord pour les polices
  if (url.origin === location.origin) {
    // app.enc et index : réseau d abord, cache si hors ligne
    const key = url.pathname.endsWith("app.enc") ? new Request(url.origin + url.pathname) : req;
    e.respondWith(fetch(req, { cache: "no-store" }).then(r => { const cp = r.clone(); if (r.ok) caches.open(VERSION).then(c => c.put(key, cp)); return r; }).catch(() => caches.match(key).then(r => r || caches.match("index.html"))));
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return res; })));
  }
});
