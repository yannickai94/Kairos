/* Kairos Service Worker: macht die App offline nutzbar (Cache-first für die eigenen Dateien). */
const CACHE = 'kairos-v10', LIBS = 'kairos-libs-v1', SHARE = 'kairos-share', CDNS = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com'];
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== LIBS && k !== SHARE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  const u = new URL(req.url);
  /* OCR- und PDF-Bibliotheken (CDN oder Ordner ocr/): einmal laden, danach offline aus dem Cache */
  if (req.method === 'GET' && (CDNS.includes(u.hostname) || (u.origin === location.origin && /\/ocr\//.test(u.pathname)))) {
    e.respondWith(caches.open(LIBS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }))));
    return;
  }
  /* Android-„Teilen“-Ziel: Dateien/Text kurz zwischenspeichern, App holt sie beim Öffnen ab */
  if (req.method === 'POST' && u.origin === location.origin && u.pathname.endsWith('/share-target')) { e.respondWith(handleShare(req)); return; }
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  /* Netzwerk zuerst (damit Updates ankommen), Cache als Fallback */
  e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});

async function handleShare(req) {
  try {
    const fd = await req.formData(), c = await caches.open(SHARE);
    for (const k of await c.keys()) await c.delete(k);
    let i = 0;
    for (const f of fd.getAll('files')) if (f && f.size) await c.put('/__share/' + (i++), new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name || 'Datei'), 'x-kind': 'file' } }));
    const text = [fd.get('title'), fd.get('text'), fd.get('url')].filter(Boolean).join('\n');
    if (text) await c.put('/__share/text', new Response(text, { headers: { 'content-type': 'text/plain;charset=utf-8', 'x-kind': 'text' } }));
  } catch (e) { /* App öffnet trotzdem */ }
  return Response.redirect(new URL('./#/verbinden', self.registration.scope).href, 303);
}
