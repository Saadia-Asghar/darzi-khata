// Development-only replacement for an old production offline worker.
// Do not clear localStorage, IndexedDB, accounts, photos, or customer records.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(windows.map(client => client.navigate(client.url)));
  })());
});
