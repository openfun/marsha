import { AnonymousUser, Loader, useCurrentUser, useJwt } from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';

const QUERY_PARAMS_CHALLENGE_TOKEN_NAME = 'token';

export const Authenticator = ({ children }: PropsWithChildren<unknown>) => {
  const { search } = useLocation();
  const code = new URLSearchParams(search).get(
    QUERY_PARAMS_CHALLENGE_TOKEN_NAME,
  );
  const { currentUser, setCurrentUser } = useCurrentUser((state) => ({
    currentUser: state.currentUser,
    setCurrentUser: state.setCurrentUser,
  }));
  const { jwt, setJwt, setRefreshJwt, resetJwt } = useJwt();

  /**
   * This useEffect is used when we want to log an anonymous user
   * thanks to the parameter `token` in the url.
   */
  useEffect(() => {
    if (!code) {
      return;
    }

    const fetchJwt = async (validationToken: string) => {
      try {
        const response = await validateChallenge(validationToken);
        setJwt(response.access);
        setRefreshJwt(response.refresh);
      } catch (error) {
        console.error(error);
      }
    };

    fetchJwt(code);
  }, [code, setJwt, setRefreshJwt]);

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
    };
    fetchUserData();
  }, [currentUser, jwt, resetJwt, setCurrentUser]);

  if (!currentUser) {
    return <Loader />;
  }

  return <Fragment>{children}</Fragment>;
};
