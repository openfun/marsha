/// <reference lib="webworker" />
// See https://developers.google.com/web/tools/workbox/modules
import { serviceWorkerRefreshToken } from 'lib-components';
import { setCacheNameDetails, clientsClaim } from 'workbox-core';
import 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

import pkg from '../package.json';

setCacheNameDetails({
  prefix: pkg.name,
  suffix: pkg.version,
});

clientsClaim();

self.__WB_MANIFEST;

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

serviceWorkerRefreshToken.init(self);
