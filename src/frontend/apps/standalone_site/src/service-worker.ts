/// <reference lib="webworker" />
// See https://developers.google.com/web/tools/workbox/modules
import { setCacheNameDetails, clientsClaim } from 'workbox-core';
import 'workbox-precaching';

import { refreshToken } from 'features/Authentication/api/refreshToken';
import {
  EServiceworkerAuthAction,
  ServiceworkerAuthMessage,
} from 'features/Authentication/model/service-worker';

declare const self: ServiceWorkerGlobalScope;

const routesAPIExclude = ['/account/api/token/'];

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

self.addEventListener('fetch', (fetchEvent: FetchEvent) => {
  if (
    routesAPIExclude.some((route) => fetchEvent.request.url.includes(route)) ||
    !fetchEvent.request.url.includes('/api')
  ) {
    return;
  }

  fetchEvent.respondWith(
    fetch(fetchEvent.request).then(async (response: Response) => {
      if (response.status !== 401) {
        return response;
      }

      // We deliver the 401 response after 1.5 seconds if the client does not respond
      const promiseTimeOut: Promise<Response> = new Promise((resolve) => {
        setTimeout(resolve, 1500, response);
      });

      let handleResponse: (event: ExtendableMessageEvent) => void;
      const promise404: Promise<Response> = new Promise((resolve) => {
        // Create a random id to identify the request
        const requestId = Math.floor(Math.random() * Date.now());

        handleResponse = (messageEvent: ExtendableMessageEvent) => {
          const currentRequest = fetchEvent.request;
          const clientId = fetchEvent.clientId;
          const resolve404 = resolve;
          const {
            action,
            requestId: clientRequestId,
            valueClient,
          } = messageEvent.data as ServiceworkerAuthMessage;

          // Listener can mix up the messages, so we check the request id
          if (clientRequestId !== requestId) {
            return;
          }

          /**
           *  - Inform the client to logout the user
           *  - Resolve the promise
           */
          const logout = () => {
            self.clients.get(clientId).then((client) => {
              if (client) {
                client.postMessage({
                  action: EServiceworkerAuthAction.LOGOUT,
                });
              }
            });

            resolve404(response);
          };

          switch (action) {
            case EServiceworkerAuthAction.ACCESS_TOKEN_RESPONSE:
              const accessToken = valueClient;
              if (!accessToken) {
                logout();
                break;
              }

              const reFetch = async () => {
                try {
                  const response = await fetch(currentRequest, {
                    ...currentRequest,
                    headers: {
                      ...currentRequest.headers,
                      Authorization: `Bearer ${accessToken}`,
                    },
                  });

                  if (response.status === 401) {
                    throw new Error('Access token is not valid');
                  }

                  resolve404(response);
                } catch (error) {
                  logout();
                }
              };

              reFetch();
              break;
            case EServiceworkerAuthAction.REFRESH_TOKEN_RESPONSE:
              const currentRefreshToken = valueClient;
              if (!currentRefreshToken) {
                logout();
                break;
              }

              (async () => {
                try {
                  const token = await refreshToken(currentRefreshToken);

                  // Send the new access token to the client
                  self.clients.get(clientId).then((client) => {
                    if (client) {
                      client.postMessage({
                        action: EServiceworkerAuthAction.SET_TOKEN,
                        valueSW: token,
                      });
                    }
                  });

                  resolve404(
                    await fetch(currentRequest, {
                      ...currentRequest,
                      headers: {
                        ...currentRequest.headers,
                        Authorization: `Bearer ${token.access}`,
                      },
                    }),
                  );
                } catch (error) {
                  // Because of asynchonicity, if 2 requests are almost at the same time, the refresh token can be blacklisted
                  // So we ask the client to send the "probable new access token" to try it again
                  self.clients.get(clientId).then((client) => {
                    if (client) {
                      client.postMessage({
                        action: EServiceworkerAuthAction.GET_ACCESS_TOKEN,
                        requestId,
                      });
                    }
                  });
                }
              })();
              break;
            default:
              break;
          }
        };

        self.addEventListener('message', handleResponse);

        // Ask the client to send the refresh token
        self.clients.get(fetchEvent.clientId).then((client) => {
          if (client) {
            client.postMessage({
              action: EServiceworkerAuthAction.GET_REFRESH_TOKEN,
              requestId,
            });
          }
        });
      });

      return await Promise.race([promise404, promiseTimeOut]).then(
        (raceResponse) => {
          self.removeEventListener('message', handleResponse);
          return raceResponse;
        },
      );
    }),
  );
});
