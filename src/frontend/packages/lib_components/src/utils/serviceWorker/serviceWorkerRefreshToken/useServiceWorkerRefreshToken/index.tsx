import { useEffect } from 'react';

import { useJwt } from '@lib-components/hooks/stores/useJwt';
import {
  EServiceworkerAuthAction,
  ServiceworkerAuthMessage,
} from '@lib-components/types/serviceWorker';

/**
 * This hook is used to communicate with the service worker
 * - It is used to get the refresh token and to set the new token when the service worker refresh it
 * - It is also used to clear the jwt when the service worker ask for it
 */
export const useServiceWorkerRefreshToken = () => {
  const { jwt, setJwt, resetJwt, refreshJwt, setRefreshJwt } = useJwt();

  /**
   * This effect is used to communicate with the service worker
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    /**
     * This handle communicates with the service worker, 3 actions are possible:
     *  - `getRefreshToken`: communicate the refresh token to the service worker when asked
     *  - `setToken`: refresh the JWT token when it got the instruction from the service worker
     *  - `logout`: clear the jwt and so logout when it got the instruction from the service worker
     */
    const handleFetch = (event: MessageEvent) => {
      const { action, requestId, valueSW } =
        event.data as ServiceworkerAuthMessage;

      switch (action) {
        case EServiceworkerAuthAction.GET_ACCESS_TOKEN:
          if (event.source) {
            event.source.postMessage({
              action: EServiceworkerAuthAction.ACCESS_TOKEN_RESPONSE,
              valueClient: jwt,
              requestId: requestId,
            });
          }
          break;
        case EServiceworkerAuthAction.GET_REFRESH_TOKEN:
          if (event.source) {
            event.source.postMessage({
              action: EServiceworkerAuthAction.REFRESH_TOKEN_RESPONSE,
              valueClient: refreshJwt,
              requestId: requestId,
            });
          }
          break;
        case EServiceworkerAuthAction.SET_TOKEN:
          if (valueSW) {
            setJwt(valueSW.access);
            setRefreshJwt(valueSW.refresh);
          }
          break;
        case EServiceworkerAuthAction.LOGOUT:
        default:
          resetJwt();
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleFetch);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleFetch);
    };
  }, [refreshJwt, setJwt, setRefreshJwt, resetJwt, jwt]);
};
