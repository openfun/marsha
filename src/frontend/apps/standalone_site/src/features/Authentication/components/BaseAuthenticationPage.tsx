import { colorsTokens } from 'lib-common';
import { Box, useResponsive, useSiteConfig } from 'lib-components';
import React, { Fragment, PropsWithChildren, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import imageLeft from 'assets/img/telescope.png';
import LogoIcon from 'assets/svg/logo_marsha.svg?react';
import { WhiteCard } from 'components/Cards';
import { HeaderLight } from 'features/Header';

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

const ResponsiveBox = ({ children }: PropsWithChildren) => {
  const intl = useIntl();
  const [isViewWidth, setIsViewWidth] = useState(getWindowIsViewWidth());
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const { getSiteConfig } = useSiteConfig();
  const siteConfig = getSiteConfig();

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
      <Box
        height={{ min: '87vh' }}
        background={backgroundImage('30%', '80%')}
        pad={{ bottom: '10px' }}
      >
        <HeaderLight bgcolor="transparent" color="white" />
        <WhiteCard width="90%" margin="auto" pad={{ vertical: 'large' }}>
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
        basis="50%"
      >
        {siteConfig.is_default_site ? (
          <LogoIcon
            color="white"
            width="80%"
            height="30%"
            aria-label={intl.formatMessage(messages.altLogo)}
          />
        ) : (
          <Box
            width="80%"
            margin="auto"
            pad={{ vertical: 'small' }}
            align="center"
          >
            <div
              dangerouslySetInnerHTML={{
                __html: siteConfig.login_html || '',
              }}
            />
          </Box>
        )}
      </Box>
      {children}
    </Fragment>
  );
};

export const BaseAuthenticationPage = ({
  children,
}: PropsWithChildren<unknown>) => {
  const { breakpoint, isSmallerBreakpoint } = useResponsive();
  const isSmallerXsmedium = isSmallerBreakpoint(breakpoint, 'xsmedium');

  return (
    <Box
      direction={isSmallerXsmedium ? 'column' : 'row'}
      height={isSmallerBreakpoint(breakpoint, 'xsmedium') ? 'auto' : '100vh'}
      background={colorsTokens['secondary-100']}
    >
      <ResponsiveBox>
        <Box style={{ flex: '1', zIndex: 11 }} align="center" justify="center">
          {children}
        </Box>
      </ResponsiveBox>
    </Box>
  );
};
