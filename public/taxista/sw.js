const VERSION = "rapitaxi-taxista-1.0.0";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Por ahora dejamos que todas las solicitudes vayan directamente
  // a la red para que los taxistas reciban siempre la versión más nueva.
});