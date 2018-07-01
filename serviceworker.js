const staticCacheName = 'cc-static-v71';
const allCaches = [staticCacheName];
const filesToCache = [
    'public/main.css',
    '/',
    'public/js/main.js',
    'node_modules/idb/lib/idb.js'
];

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('cc-') &&
                        !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName)
        .then(cache => {
            return cache.addAll(filesToCache).catch(() => {
                console.log('cant cache items');
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.open(staticCacheName).then(cache => {
            return cache.match(event.request).then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(networkResponse => {
                    return networkResponse;
                })
            })
        })

    )
})