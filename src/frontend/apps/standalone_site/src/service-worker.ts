/// <reference lib="webworker" />

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
import { setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

import pkg from '../package.json';

setCacheNameDetails({
  prefix: pkg.name,
  suffix: pkg.version,
});

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.url.includes('/api')) {
    console.log('Service worker::::', event.request);

    event.respondWith(
      fetch(event.request).then((response: Response) => {
        if (response.status === 401) {
          console.log('Service worker 401', response);
          return response;
        } else {
          console.log('Service worker OK', response);
          return response;
        }
      }),
    );
  }
});
