import { Loader, useCurrentUser, useJwt } from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';

const TARGET_URL_STORAGE_KEY = 'redirect_uri';
const QUERY_PARAMS_CHALLENGE_TOKEN_NAME = 'token';

export const Authenticator = ({ children }: PropsWithChildren<unknown>) => {
  const location = useLocation();
  const history = useHistory();
  const code = new URLSearchParams(location.search).get(
    QUERY_PARAMS_CHALLENGE_TOKEN_NAME,
  );
  const { currentUser, setCurrentUser } = useCurrentUser((state) => ({
    currentUser: state.currentUser,
    setCurrentUser: state.setCurrentUser,
  }));
  const { jwt, setJwt } = useJwt((state) => ({
    jwt: state.jwt,
    setJwt: state.setJwt,
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
      const targetedAddress =
        process.env.REACT_APP_BACKEND_API_BASE_URL || window.location.origin;
      localStorage.setItem(
        TARGET_URL_STORAGE_KEY,
        location.pathname + location.search,
      );
      window.location.replace(targetedAddress + '/account/login/');
    }
  }, [code, jwt, location, setJwt]);

  useEffect(() => {
    if (!jwt || currentUser) {
      return;
    }

    const fetchUserData = async () => {
      setCurrentUser(await getCurrentUser(jwt));

      const targetUri = localStorage.getItem(TARGET_URL_STORAGE_KEY);
      localStorage.removeItem(TARGET_URL_STORAGE_KEY);
      // redirect to the originally targeted URL (ie before the authentication loop)
      // or the root page if no target was set
      history.replace(targetUri || location.pathname);
    };
    fetchUserData();
  }, [jwt, currentUser, location, setCurrentUser, history]);

  if (!jwt && !code) {
    return <Fragment />;
  } else if (!currentUser) {
    return <Loader />;
  }

  return <Fragment>{children}</Fragment>;
};
