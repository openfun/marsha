import { Box } from 'grommet';
import { useJwt, refreshToken, useResponsive } from 'lib-components';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { ContentSpinner } from 'components/Spinner';
import { routes } from 'routes';

import { LoginForm } from './LoginForm';
import { RenaterAuthenticator } from './RenaterAuthenticator';

export const Login = () => {
  const history = useHistory();
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const isSmallerMedium = isSmallerBreakpoint(breakpoint, 'medium');
  const isSmallerSmall = isSmallerBreakpoint(breakpoint, 'small');
  const { refreshJwt, resetJwt, setJwt, setRefreshJwt } = useJwt();
  const [isUserChecked, setIsUserChecked] = useState(false);

  // If the user is already logged in, redirect to the homepage
  useEffect(() => {
    if (!refreshJwt || isUserChecked) {
      setIsUserChecked(true);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const token = await refreshToken(refreshJwt, controller.signal);

        setIsUserChecked(true);
        setJwt(token.access);
        setRefreshJwt(token.refresh);
        history.push(routes.HOMEPAGE.path);
      } catch (error) {
        setIsUserChecked(true);
        resetJwt();
      }
    })();

    return () => {
      controller.abort();
    };
  }, [history, isUserChecked, refreshJwt, resetJwt, setJwt, setRefreshJwt]);

  if (refreshJwt) {
    return <ContentSpinner boxProps={{ height: '100vh' }} />;
  }

  return (
    <React.Fragment>
      <Box
        width={{
          max: 'large',
          width: isSmallerSmall || breakpoint === 'xsmedium' ? '90%' : '80%',
        }}
        pad={{
          horizontal:
            breakpoint === 'xsmedium'
              ? 'medium'
              : isSmallerMedium
              ? 'large'
              : 'xlarge',
        }}
      >
        <LoginForm />
      </Box>
      <Box
        width={{
          max: 'large',
          width: isSmallerSmall || breakpoint === 'xsmedium' ? '90%' : '80%',
        }}
        margin={{ top: 'large' }}
      >
        <RenaterAuthenticator />
      </Box>
    </React.Fragment>
  );
};
