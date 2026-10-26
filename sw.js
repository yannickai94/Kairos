/* Kairos Service Worker: macht die App offline nutzbar (Cache-first für die eigenen Dateien). */
const CACHE = 'kairos-v5', LIBS = 'kairos-libs-v1', CDNS = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com'];
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== LIBS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  const u = new URL(req.url);
  /* OCR- und PDF-Bibliotheken: einmal laden, danach offline aus dem Cache */
  if (req.method === 'GET' && CDNS.includes(u.hostname)) {
    e.respondWith(caches.open(LIBS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  /* Netzwerk zuerst (damit Updates ankommen), Cache als Fallback */
  e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
