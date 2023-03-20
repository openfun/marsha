import { Box, Button, DropButton, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import { AnonymousUser, useCurrentUser, useResponsive } from 'lib-components';
import { forwardRef, useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link, NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';
import { ReactComponent as LogoutIcon } from 'assets/svg/logout.svg';
import { ReactComponent as SettingsIcon } from 'assets/svg/settings.svg';
import { logout } from 'features/Authentication';
import { Burger } from 'features/Menu';
import { routes } from 'routes/routes';

const NavLinkStyled = styled(NavLink)`
  text-decoration: none;
  color: ${normalizeColor('blue-active', theme)};
  display: flex;
  gap: 1rem;
  align-items: left;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease-in-out;
  &:hover,
  &.hover {
    background-color: ${normalizeColor('bg-menu-hover', theme)};
  }
`;

const ButtonStyled = styled(Button)`
  text-decoration: none;
  color: ${normalizeColor('blue-active', theme)};
  display: flex;
  gap: 1rem;
  align-items: left;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease-in-out;
  &:hover,
  &.hover {
    background-color: ${normalizeColor('bg-menu-hover', theme)};
  }
`;

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
  const { isDesktop } = useResponsive();
  const { currentUser } = useCurrentUser((state) => ({
    currentUser: state.currentUser,
  }));
  const [fullName, setFullName] = useState<Nullable<string>>();
  const [isDropOpen, setIsDropOpen] = useState(false);

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
        gap="medium"
      >
        <Burger width={60} height={60} aria-controls="menu" />
        <Link to={routes.HOMEPAGE.path} style={{ color: 'currentColor' }}>
          <LogoIcon width={117} height={80} />
        </Link>
      </Box>

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
            <Text>{fullName}</Text>
            <AvatarIcon
              title={intl.formatMessage(messages.iconTitle)}
              width={42}
              height={42}
            />
          </Box>
        }
        dropAlign={{ top: 'bottom', right: 'right' }}
        dropContent={
          <Box direction="column" margin="small" gap="small">
            <NavLinkStyled
              to={routes.PROFILE.path}
              onClick={() => {
                setIsDropOpen(false);
              }}
            >
              <AvatarIcon />
              {intl.formatMessage(messages.profile)}
            </NavLinkStyled>

            <NavLinkStyled
              to={routes.PROFILE.subRoutes.PROFILE_SETTINGS.path}
              onClick={() => {
                setIsDropOpen(false);
              }}
            >
              <SettingsIcon /> {intl.formatMessage(messages.settings)}
            </NavLinkStyled>

            <ButtonStyled
              plain
              onClick={() => {
                logout();
              }}
            >
              <LogoutIcon />
              {intl.formatMessage(messages.logout)}
            </ButtonStyled>
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
    </HeaderBox>
  );
});

Header.displayName = 'Header';
export default Header;
