/// <reference lib="webworker" />
// See https://developers.google.com/web/tools/workbox/modules
import {
  serviceWorkerRefreshToken,
  serviceWorkerForceInstall,
} from 'lib-components';
import { clientsClaim } from 'workbox-core/clientsClaim';
import { setCacheNameDetails } from 'workbox-core/setCacheNameDetails';
import 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

import pkg from '../package.json';

self.__WB_MANIFEST;

setCacheNameDetails({
  prefix: pkg.name,
  suffix: pkg.version,
});

clientsClaim();

serviceWorkerForceInstall.init(self);
serviceWorkerRefreshToken.init(self);
