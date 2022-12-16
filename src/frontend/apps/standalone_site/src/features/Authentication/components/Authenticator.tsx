import { AnonymousUser, Loader, useCurrentUser, useJwt } from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { routes } from 'routes';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';
import {
  EServiceworkerAuthAction,
  ServiceworkerAuthMessage,
} from '../model/service-worker';

const TARGET_URL_STORAGE_KEY = 'redirect_uri';
const QUERY_PARAMS_CHALLENGE_TOKEN_NAME = 'token';

export const Authenticator = ({ children }: PropsWithChildren<unknown>) => {
  const { pathname, search } = useLocation();
  const history = useHistory();
  const code = new URLSearchParams(search).get(
    QUERY_PARAMS_CHALLENGE_TOKEN_NAME,
  );
  const { currentUser, setCurrentUser } = useCurrentUser((state) => ({
    currentUser: state.currentUser,
    setCurrentUser: state.setCurrentUser,
  }));
  const { jwt, setJwt, resetJwt, refreshJwt, setRefreshJwt } = useJwt();

  useEffect(() => {
    if (jwt) {
      return;
    }

    const fetchJwt = async (validationToken: string) => {
      setJwt(await validateChallenge(validationToken));
    };

    if (code) {
      fetchJwt(code);
    } else {
      localStorage.setItem(TARGET_URL_STORAGE_KEY, pathname + search);
      history.push(routes.LOGIN.path);
    }
  }, [code, history, jwt, pathname, search, setJwt]);

  useEffect(() => {
    if (!jwt || currentUser) {
      return;
    }

    const fetchUserData = async () => {
      const _currentUser = await getCurrentUser(jwt);
      if (_currentUser === AnonymousUser.ANONYMOUS) {
        // if the user is not authenticated, we clear the jwt and so logout
        resetJwt();
        return;
      }

      setCurrentUser(_currentUser);

      const targetUri = localStorage.getItem(TARGET_URL_STORAGE_KEY);
      localStorage.removeItem(TARGET_URL_STORAGE_KEY);
      // redirect to the originally targeted URL (ie before the authentication loop)
      // or the root page if no target was set
      history.replace(targetUri || pathname);
    };
    fetchUserData();
  }, [currentUser, history, jwt, pathname, resetJwt, setCurrentUser]);

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

  if (!jwt && !code) {
    return <Fragment />;
  } else if (!currentUser) {
    return <Loader />;
  }

  return <Fragment>{children}</Fragment>;
};
