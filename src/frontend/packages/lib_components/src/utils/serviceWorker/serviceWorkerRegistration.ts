// This optional code is used to register a service worker.
// register() is not called by default.

import { report } from '@lib-components/utils/errors/report';

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://cra.link/PWA

const isLocalhost = () =>
  Boolean(
    global.window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      global.window.location.hostname === '[::1]' ||
      // 127.0.0.0/8 are considered localhost for IPv4.
      global.window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
      ),
  );

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onActivated?: (registration: ServiceWorkerRegistration) => void;
  rootApp?: string;
  swId?: string; // Add a unique id to the service worker to avoid conflicts
};

export function register(config?: Config) {
  if (
    (process.env.NODE_ENV === 'production' || isLocalhost()) &&
    'serviceWorker' in navigator
  ) {
    global.window.addEventListener('load', () => {
      const swUrl = `${config?.rootApp || '/'}service-worker.js${
        config?.swId ? `?${config?.swId}` : ''
      }`;
      if (isLocalhost()) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker === null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          } else if (installingWorker.state === 'activated') {
            // Execute callback
            if (config && config.onActivated) {
              config.onActivated(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      report(error);
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType !== null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            global.window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'No internet connection found. App is running in offline mode.',
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.error(error.message);
      });
  }
}
