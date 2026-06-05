const CACHE = 'bboard-v1';

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(['/', '/index.html']))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    // API : réseau en priorité, pas de mise en cache
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;
    // Assets statiques : cache en priorité
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                if (!res || res.status !== 200 || res.type === 'opaque') return res;
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
                return res;
            });
        })
    );
});
