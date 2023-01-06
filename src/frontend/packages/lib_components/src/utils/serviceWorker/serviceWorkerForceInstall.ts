/// <reference lib="webworker" />
// See https://developers.google.com/web/tools/workbox/modules

/**
 * It will try to force the service worker to install the new version if one is available
 */
export const init = (self: ServiceWorkerGlobalScope) => {
  self.addEventListener('install', function (event) {
    event.waitUntil(self.skipWaiting());
  });
  self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
  });

  // This allows the web app to trigger skipWaiting via
  // registration.waiting.postMessage({type: 'SKIP_WAITING'})
  self.addEventListener('message', (event) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
};
