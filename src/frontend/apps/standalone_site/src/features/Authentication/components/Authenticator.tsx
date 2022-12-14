import { AnonymousUser, Loader, useCurrentUser, useJwt } from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { TIME_USER_SESSION } from 'conf/global';
import { routes } from 'routes';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';

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
  const { jwt, setJwt, reset, jwtCreateTimestamp } = useJwt((state) => ({
    jwt: state.jwt,
    setJwt: state.setJwt,
    reset: state.reset,
    jwtCreateTimestamp: state.jwtCreateTimestamp,
  }));

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
        reset();
        history.push(routes.LOGIN.path);
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
  }, [jwt, currentUser, pathname, setCurrentUser, history, reset]);

  /**
   * Reset the JWT token every TIME_USER_SESSION minutes
   */
  useEffect(() => {
    if (
      jwtCreateTimestamp &&
      jwtCreateTimestamp + TIME_USER_SESSION * 60 * 1000 < Date.now()
    ) {
      reset();
    }
  }, [reset, jwtCreateTimestamp]);

  if (!jwt && !code) {
    return <Fragment />;
  } else if (!currentUser) {
    return <Loader />;
  }

  return <Fragment>{children}</Fragment>;
};
