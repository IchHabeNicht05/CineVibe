self.addEventListener("install", (event) => {
  // Okamžitě aktivuje nový service worker bez čekání
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Převezme kontrolu nad všemi otevřenými záložkami webu
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Prázdný fetch handler je vyžadován pro splnění instalačních kritérií PWA
});