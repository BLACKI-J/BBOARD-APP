const CACHE = 'bboard-v2';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const { request } = e;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return; // cross-origin → réseau direct
    // API / temps réel : jamais de cache
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

    // Navigations (HTML / SPA) : RÉSEAU d'abord → évite la coquille périmée après un
    // déploiement ; repli sur le cache si hors-ligne.
    if (request.mode === 'navigate') {
        e.respondWith(
            fetch(request)
                .then(res => {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put('/', clone));
                    return res;
                })
                .catch(() => caches.match(request).then(r => r || caches.match('/')))
        );
        return;
    }

    // Assets (fichiers hashés, immuables) : CACHE d'abord, sinon réseau + mise en cache.
    e.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(res => {
                if (res && res.status === 200 && res.type !== 'opaque') {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(request, clone));
                }
                return res;
            });
        })
    );
});
