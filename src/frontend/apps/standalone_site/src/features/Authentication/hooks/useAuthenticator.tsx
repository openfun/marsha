import {
  AnonymousUser,
  decodeJwt,
  report,
  useCurrentUser,
  useJwt,
} from 'lib-components';
import { useEffect, useState } from 'react';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { useRoutes } from 'routes/useRoutes';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';
import { validateClassroomInviteToken } from '../api/validateClassroomInviteToken';

const QUERY_PARAMS_CHALLENGE_TOKEN_NAME = 'token';

export const useAuthenticator = () => {
  const routes = useRoutes();
  const match = useRouteMatch(
    routes.CONTENTS.subRoutes?.CLASSROOM?.subRoutes?.INVITE.path || '',
  ) as { params?: { classroomId?: string; inviteId?: string } } | null;
  const inviteId = match?.params?.inviteId;
  const classroomId = match?.params?.classroomId;

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
    if (!inviteId) {
      return;
    }
    const fetchInvite = async (classroomId: string, inviteId: string) => {
      try {
        const response = await validateClassroomInviteToken(
          classroomId,
          inviteId,
        );
        setJwt(response.access_token);
        setIsLoading(false);
      } catch (error) {
        report(error);
      }
    };

    try {
      // First try if it's a legacy inviteId. A legacy inviteId is a valid access token
      // If decoding it is possible then it means we have a legacy inviteId and we can stop here.
      // This try catch is subject to be removed in few months when all legacy inviteId will be
      // expired.
      decodeJwt(inviteId);
      setJwt(inviteId);
      setIsLoading(false);
    } catch (error) {
      // Otherwise, it's probably a new inviteId store in the classroom model.
      // We have to test it by fetching the classroom invite endpoint.
      classroomId && fetchInvite(classroomId, inviteId);
    }
  }, [inviteId, classroomId, setJwt, setIsLoading]);

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
