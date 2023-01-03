import { Box, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import { AnonymousUser, useCurrentUser } from 'lib-components';
import { forwardRef, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';
import { Burger } from 'features/Menu';
import { useResponsive } from 'hooks/useResponsive';

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
  z-index: 2;
`;

const Header = forwardRef<Nullable<HTMLDivElement>>((_props, ref) => {
  const [isScrollTop, setIsScrollTop] = useState(true);
  const { isDesktop } = useResponsive();
  const { currentUser } = useCurrentUser((state) => ({
    currentUser: state.currentUser,
  }));
  const [fullName, setFullName] = useState<Nullable<string>>();

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
        <LogoIcon width={117} height={80} />
      </Box>
      <Box direction="row" align="center" gap="small" justify="end">
        <Text>{fullName}</Text>
        <AvatarIcon width={42} height={42} />
      </Box>
    </HeaderBox>
  );
});

Header.displayName = 'Header';
export default Header;
