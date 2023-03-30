/// <reference lib="webworker" />
// See https://developers.google.com/web/tools/workbox/modules

/**
 * The service worker works as a proxy between the client and the server.
 * It will listen predefined routes and try to refresh the token if the response is 401.
 * In order to works, you must include the hook `useServiceWorkerRefreshToken` in your app.
 */
import { refreshToken } from '@lib-components/data/sideEffects/refreshToken';
import {
  EServiceworkerAuthAction,
  ServiceworkerAuthMessage,
} from '@lib-components/types/serviceWorker';

export const init = (
  self: ServiceWorkerGlobalScope,
  _routesExclude?: string[],
  _routesInclude?: string[],
) => {
  let routesExclude = ['/account/api/token/', '/e2e/api/'];
  let routesInclude = ['/api/', '/xapi/'];
  const fetchEventMap = new Map<
    number,
    {
      clientId?: string;
      requestInit?: Request;
      resolve404?: (response: Response) => void;
    }
  >();

  if (_routesExclude) {
    routesExclude = [...routesExclude, ..._routesExclude];
  }
  if (_routesInclude) {
    routesInclude = [...routesInclude, ..._routesInclude];
  }

  self.addEventListener('fetch', (fetchEvent: FetchEvent) => {
    if (
      routesExclude.some((route) => fetchEvent.request.url.includes(route)) ||
      !routesInclude.some((route) => fetchEvent.request.url.includes(route))
    ) {
      return;
    }

    // Create a random id to identify the request
    const requestId = Math.floor(Math.random() * Date.now());
    fetchEventMap.set(requestId, {
      requestInit: fetchEvent.request.clone(),
      clientId: fetchEvent.clientId,
    });

    fetchEvent.respondWith(
      fetch(fetchEvent.request).then(async (response: Response) => {
        if (response.status !== 401) {
          fetchEventMap.delete(requestId);
          return response;
        }

        // We deliver the 401 response after 1.5 seconds if the client does not respond
        const promiseTimeOut: Promise<Response> = new Promise((resolve) => {
          setTimeout(resolve, 1500, response);
        });

        let handleResponse: (event: ExtendableMessageEvent) => void;
        const promise404: Promise<Response> = new Promise((resolve) => {
          fetchEventMap.set(requestId, {
            ...fetchEventMap.get(requestId),
            resolve404: resolve,
          });

          handleResponse = (messageEvent: ExtendableMessageEvent) => {
            const {
              action,
              requestId: clientRequestId,
              valueClient,
            } = messageEvent.data as ServiceworkerAuthMessage;

            // Listener can mix up the messages, so we check the request id
            if (clientRequestId !== requestId) {
              return;
            }

            const currentRequest =
              fetchEventMap.get(clientRequestId)?.requestInit ||
              fetchEvent.request;
            const clientId =
              fetchEventMap.get(clientRequestId)?.clientId ||
              fetchEvent.clientId;
            const resolve404 =
              fetchEventMap.get(clientRequestId)?.resolve404 || resolve;

            const responseRecovery = async (freshAccessToken: string) => {
              let body;
              if (currentRequest.body) {
                const bodyResult = await currentRequest.body
                  .pipeThrough(new TextDecoderStream())
                  .getReader()
                  .read();

                body = bodyResult.value;
              }

              return await fetch(
                new Request(currentRequest.url, {
                  method: currentRequest.method,
                  body,
                  headers: {
                    ...currentRequest.headers,
                    'Content-Type':
                      currentRequest.headers.get('content-Type') || undefined,
                    Authorization: `Bearer ${freshAccessToken}`,
                  },
                }),
              );
            };

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
              /**
               * - If multiple requests are made very quickly, the refresh token can be blacklisted,
               *   in this case, we try to reconnect with the access token.
               */
              case EServiceworkerAuthAction.ACCESS_TOKEN_RESPONSE:
                const accessToken = valueClient;
                if (!accessToken) {
                  logout();
                  break;
                }

                const reFetch = async () => {
                  try {
                    const response = await responseRecovery(accessToken);
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
              /**
               *  - Refresh the access token and send it to the client.
               *  - Resolve the promise with the new access teken.
               */
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

                    resolve404(await responseRecovery(token.access));
                  } catch (error) {
                    // Because of asynchonicity, if 2 requests are almost at the same time,
                    // the refresh token can be blacklisted
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
            fetchEventMap.delete(requestId);
            self.removeEventListener('message', handleResponse);
            return raceResponse;
          },
        );
      }),
    );
  });
};
