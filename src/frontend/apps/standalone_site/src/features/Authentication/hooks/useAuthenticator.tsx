import { AnonymousUser, useCurrentUser, useJwt } from 'lib-components';
import { useEffect, useState } from 'react';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { useRoutes } from 'routes/useRoutes';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';

const QUERY_PARAMS_CHALLENGE_TOKEN_NAME = 'token';

export const useAuthenticator = () => {
  const routes = useRoutes();
  const match = useRouteMatch(
    routes.CONTENTS.subRoutes?.CLASSROOM?.subRoutes?.INVITE.path || '',
  ) as { params?: { inviteId?: string } } | null;
  const inviteId = match?.params?.inviteId;

  const history = useHistory();
  const { search } = useLocation();
  const code = new URLSearchParams(search).get(
    QUERY_PARAMS_CHALLENGE_TOKEN_NAME,
  );
  const { currentUser, setCurrentUser } = useCurrentUser((state) => ({
    currentUser: state.currentUser,
    setCurrentUser: state.setCurrentUser,
  }));
  const { jwt, setJwt, setRefreshJwt, resetJwt, setDecodedJwt } = useJwt();

  const [isAuthenticated, setIsAuthenticated] = useState(
    currentUser !== AnonymousUser.ANONYMOUS && !!currentUser,
  );
  const [isLoading, setIsLoading] = useState(!isAuthenticated);

  useEffect(() => {
    if (inviteId) {
      setJwt(inviteId);
      setIsLoading(false);
    }
  }, [inviteId, setJwt, setIsAuthenticated, setIsLoading]);

  /**
   * This useEffect is used when we want to log an anonymous user
   * thanks to the parameter `token` in the url.
   */
  useEffect(() => {
    if (!code || jwt) {
      return;
    }

    const fetchJwt = async (validationToken: string) => {
      try {
        const response = await validateChallenge(validationToken);
        setJwt(response.access);
        setRefreshJwt(response.refresh);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    fetchJwt(code);
  }, [code, setJwt, setRefreshJwt, jwt]);

  /**
   * We check if the user is authenticated or not.
   */
  useEffect(() => {
    if (currentUser || inviteId) {
      setIsLoading(false);
      return;
    }

    if (!jwt) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);

      const _currentUser = await getCurrentUser(jwt);
      if (_currentUser === AnonymousUser.ANONYMOUS) {
        // if the user is not authenticated, we clear the jwt and so logout
        resetJwt();
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setDecodedJwt(jwt);
      setCurrentUser(_currentUser);
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    fetchUserData();
  }, [
    currentUser,
    jwt,
    resetJwt,
    setCurrentUser,
    setDecodedJwt,
    history,
    inviteId,
  ]);

  return {
    isAuthenticated,
    isLoading,
  };
};
