const CACHE_NAME = 'musiclass-v6-exterminator';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força o novo SW a assumir imediatamente
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Deletando cache antigo:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim()) // Assume controle das abas abertas imediatamente
    );
});

self.addEventListener('fetch', (event) => {
    // Modo transparente: Não intercepta nada, deixa passar para a rede
    return;
});
