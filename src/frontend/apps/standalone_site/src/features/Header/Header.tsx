import { Button } from '@openfun/cunningham-react';
import { Box, DropButton } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Breakpoints, Nullable, theme } from 'lib-common';
import {
  AnonymousUser,
  Text,
  useCurrentUser,
  useResponsive,
  useSiteConfig,
} from 'lib-components';
import { forwardRef, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as MarshaLogoIcon } from 'assets/svg/logo_marsha.svg';
import { ReactComponent as LogoutIcon } from 'assets/svg/logout.svg';
import { ReactComponent as SettingsIcon } from 'assets/svg/settings.svg';
import { logout } from 'features/Authentication';
import { LanguagePicker } from 'features/Language/';
import { Burger } from 'features/Menu';
import { routes } from 'routes/routes';

const colorMenu = normalizeColor('blue-active', theme);

interface PropsExtended {
  isScrollTop: boolean;
  isDesktop: boolean;
}

const HeaderBox = styled(Box)<PropsExtended>`
  position: fixed;
  color: ${colorMenu};
  transition: all 0.3s ease-in-out;
  ${(props) =>
    props.isScrollTop && props.isDesktop
      ? `background: transparent;`
      : `
        background: #fff;                                                                     
        box-shadow: 1px 1px 20px #cce4f3;
      `}
  z-index: 11;
`;

const messages = defineMessages({
  iconTitle: {
    defaultMessage: 'Account',
    description: 'Menu user icon title.',
    id: 'features.Header.iconTitle',
  },
  profile: {
    defaultMessage: 'My profile',
    description: 'My profile link in header drop.',
    id: 'features.Header.profile',
  },
  settings: {
    defaultMessage: 'Settings',
    description: 'Settings link in header drop.',
    id: 'features.Header.settings',
  },
  logout: {
    defaultMessage: 'Logout',
    description: 'Logout action in header drop.',
    id: 'features.Header.logout',
  },
});

const Header = forwardRef<Nullable<HTMLDivElement>>((_props, ref) => {
  const intl = useIntl();
  const [isScrollTop, setIsScrollTop] = useState(true);
  const { isDesktop, breakpoint, isSmallerBreakpoint } = useResponsive();
  const { currentUser } = useCurrentUser((state) => ({
    currentUser: state.currentUser,
  }));
  const [fullName, setFullName] = useState<Nullable<string>>();
  const [isDropOpen, setIsDropOpen] = useState(false);
  const { getSiteConfig } = useSiteConfig();
  const siteConfig = getSiteConfig();

  useEffect(() => {
    if (currentUser === AnonymousUser.ANONYMOUS) {
      return;
    }

    setFullName(currentUser?.full_name);
  }, [currentUser, setFullName]);

  useEffect(() => {
    const onScroll = () => {
      window.scrollY ? setIsScrollTop(false) : setIsScrollTop(true);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <HeaderBox
      ref={ref}
      role="menubar"
      direction="row"
      width="100%"
      justify="between"
      pad={{ horizontal: 'medium' }}
      isScrollTop={isScrollTop}
      isDesktop={isDesktop}
    >
      <Box
        direction="row"
        justify="between"
        margin={{ bottom: 'small' }}
        pad={{ right: 'medium' }}
        gap={
          isSmallerBreakpoint(breakpoint, Breakpoints.small) ? 'none' : 'medium'
        }
      >
        <Burger
          width={60}
          height={60}
          aria-controls="menu"
          style={{ flex: 'none' }}
        />
        {siteConfig.is_default_site && (
          <Link to={routes.HOMEPAGE.path} style={{ color: 'currentColor' }}>
            <MarshaLogoIcon
              height={
                isSmallerBreakpoint(breakpoint, Breakpoints.small)
                  ? '100%'
                  : '80px'
              }
            />
          </Link>
        )}
        {!siteConfig.is_default_site && siteConfig.is_logo_enabled && (
          <Link to={routes.HOMEPAGE.path} style={{ color: 'currentColor' }}>
            {!siteConfig.logo_url ? (
              <MarshaLogoIcon
                height={
                  isSmallerBreakpoint(breakpoint, Breakpoints.small)
                    ? '100%'
                    : '80px'
                }
              />
            ) : (
              <Box margin={{ top: 'small' }}>
                <img src={siteConfig.logo_url} alt="Home" />
              </Box>
            )}
          </Link>
        )}
      </Box>

      <Box direction="row" align="center" gap="small" justify="end">
        <LanguagePicker />
        <DropButton
          open={isDropOpen}
          onOpen={() => {
            setIsDropOpen(true);
          }}
          onClose={() => {
            setIsDropOpen(false);
          }}
          plain
          label={
            <Box direction="row" align="center" gap="small" justify="end">
              {!isSmallerBreakpoint(breakpoint, Breakpoints.xsmall) && (
                <Text
                  truncate={2}
                  style={{
                    maxWidth: '90px',
                  }}
                >
                  {fullName}
                </Text>
              )}
              <AvatarIcon
                style={{ flex: 'none' }}
                title={intl.formatMessage(messages.iconTitle)}
                width={42}
                height={42}
              />
            </Box>
          }
          dropAlign={{ top: 'bottom', right: 'right' }}
          dropContent={
            <Box direction="column" margin="small" gap="xsmall">
              <NavLink
                className="c__button c__button--tertiary c__button--medium  c__button--with-icon--left"
                to={routes.PROFILE.path}
                onClick={() => {
                  setIsDropOpen(false);
                }}
              >
                <AvatarIcon />
                <Text>{intl.formatMessage(messages.profile)}</Text>
              </NavLink>
              <NavLink
                className="c__button c__button--tertiary c__button--medium  c__button--with-icon--left"
                to={routes.PROFILE.subRoutes.PROFILE_SETTINGS.path}
                onClick={() => {
                  setIsDropOpen(false);
                }}
              >
                <SettingsIcon />{' '}
                <Text>{intl.formatMessage(messages.settings)}</Text>
              </NavLink>
              <Button
                onClick={() => {
                  logout();
                }}
                icon={<LogoutIcon />}
                color="tertiary"
              >
                <Text>{intl.formatMessage(messages.logout)}</Text>
              </Button>
            </Box>
          }
          dropProps={{
            round: 'xsmall',
            border: {
              color: 'blue-active',
              size: '2px',
            },
            style: {
              zIndex: 991,
            },
          }}
        />
      </Box>
    </HeaderBox>
  );
});

Header.displayName = 'Header';
export default Header;
