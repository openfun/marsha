import {
  AnonymousUser,
  isLocalStorageEnabled,
  Loader,
  useCurrentUser,
  useJwt,
} from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { routes } from 'routes';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';

const TARGET_URL_STORAGE_KEY = 'redirect_uri';
const QUERY_PARAMS_CHALLENGE_TOKEN_NAME = 'token';

function getLocalStorage() {
  if (isLocalStorageEnabled()) {
    return localStorage;
  }
  return undefined;
}

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
  const { jwt, setJwt, resetJwt } = useJwt();

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
      getLocalStorage()?.setItem(TARGET_URL_STORAGE_KEY, pathname + search);
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

      const targetUri = getLocalStorage()?.getItem(TARGET_URL_STORAGE_KEY);
      getLocalStorage()?.removeItem(TARGET_URL_STORAGE_KEY);
      // redirect to the originally targeted URL (ie before the authentication loop)
      // or the root page if no target was set
      history.replace(targetUri || pathname);
    };
    fetchUserData();
  }, [currentUser, history, jwt, pathname, resetJwt, setCurrentUser]);

  if (!jwt && !code) {
    return <Fragment />;
  } else if (!currentUser) {
    return <Loader />;
  }

  return <Fragment>{children}</Fragment>;
};
