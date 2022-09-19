import { Loader, useCurrentUser, useJwt } from 'lib-components';
import { Fragment, PropsWithChildren, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { getCurrentUser } from '../api/getUserData';
import { validateChallenge } from '../api/validateChallenge';

const TARGET_URL_STORAGE_KEY = 'redirect_uri';

export const Authenticator = ({ children }: PropsWithChildren<unknown>) => {
  const location = useLocation();
  const code = new URLSearchParams(location.search).get('token');
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
        window.location.origin + window.location.pathname,
      );
      window.location.replace(targetedAddress + '/account/login/');
    }
  }, [code, jwt, setJwt]);

  useEffect(() => {
    if (!jwt || currentUser) {
      return;
    }

    const fetchUserData = async () => {
      setCurrentUser(await getCurrentUser(jwt));

      const targetUri = localStorage.getItem(TARGET_URL_STORAGE_KEY);
      localStorage.removeItem(TARGET_URL_STORAGE_KEY);
      //  remove token from url
      window.history.replaceState(
        null,
        '',
        targetUri || window.location.origin + window.location.pathname,
      );
    };
    fetchUserData();
  }, [jwt, currentUser, setCurrentUser]);

  if (!jwt && !code) {
    return <Fragment />;
  } else if (!currentUser) {
    return <Loader />;
  }

  return <>{children}</>;
};
