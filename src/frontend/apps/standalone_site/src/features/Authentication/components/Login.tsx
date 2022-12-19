import { Box } from 'grommet';
import { useJwt } from 'lib-components';
import React, { Fragment, ReactNode, useEffect, useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useHistory } from 'react-router-dom';

import imageLeft from 'assets/img/telescope.png';
import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';
import { WhiteCard } from 'components/Cards';
import { ContentSpinner } from 'components/Spinner';
import { HeaderLight } from 'features/Header';
import { useResponsive } from 'hooks/useResponsive';
import { routes } from 'routes';

import { refreshToken } from '../api/refreshToken';

import { LoginForm } from './LoginForm';
import { RenaterAuthenticator } from './RenaterAuthenticator';

const messages = defineMessages({
  altLogo: {
    defaultMessage: 'Marsha logo',
    description: 'Accessible description for the Marsha logo',
    id: 'features.Authentication.Login.altLogo',
  },
});

const backgroundImage = (topPosition: string, size: string) => `
  linear-gradient(to right, rgba(5, 95, 210, 0.75), rgba(5, 95, 210, 0.75)), 
  url(${imageLeft}) no-repeat center ${topPosition} / ${size}, 
  linear-gradient(45deg,rgba(255, 11, 57, 0.3) 0%,rgba(3, 92, 205, 0.9) 100%)
`;

const getWindowIsViewWidth = () => window.innerHeight > window.innerWidth / 2;

const ResponsiveBox = ({ children }: { children: ReactNode }) => {
  const intl = useIntl();
  const [isViewWidth, setIsViewWidth] = useState(getWindowIsViewWidth());
  const { breakpoint, isSmallerBreakpoint } = useResponsive();

  useEffect(() => {
    function handleWindowResize() {
      setIsViewWidth(getWindowIsViewWidth());
    }

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  if (isSmallerBreakpoint(breakpoint, 'xsmedium')) {
    return (
      <Box height="100vh" background={backgroundImage('30%', '80%')}>
        <HeaderLight bgcolor="transparent" color="white" />
        <WhiteCard
          width="90%"
          margin="auto"
          flex={false}
          pad={{ vertical: 'xlarge' }}
        >
          {children}
        </WhiteCard>
      </Box>
    );
  }

  return (
    <Fragment>
      <Box
        align="center"
        justify="center"
        background={backgroundImage('center', isViewWidth ? '45vw' : '80vh')}
        style={{ flex: '1' }}
      >
        <LogoIcon
          color="white"
          width="80%"
          height="30%"
          aria-label={intl.formatMessage(messages.altLogo)}
        />
      </Box>
      {children}
    </Fragment>
  );
};

export const Login = () => {
  const history = useHistory();
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const isSmallerXsmedium = isSmallerBreakpoint(breakpoint, 'xsmedium');
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
    <Box
      direction={isSmallerXsmedium ? 'column' : 'row'}
      height="100vh"
      background="bg-lightgrey2"
    >
      <ResponsiveBox>
        <Box style={{ flex: '1' }} align="center" justify="center">
          <Box
            width={{
              max: 'large',
              width:
                isSmallerSmall || breakpoint === 'xsmedium' ? '90%' : '80%',
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
              width:
                isSmallerSmall || breakpoint === 'xsmedium' ? '90%' : '80%',
            }}
            margin={{ top: 'large' }}
          >
            <RenaterAuthenticator />
          </Box>
        </Box>
      </ResponsiveBox>
    </Box>
  );
};
