import { Box, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';
import { Burger } from 'features/Menu';

const colorMenu = normalizeColor('blue-active', theme);

interface PropsExtended {
  isScrollTop: boolean;
}

const HeaderBox = styled(Box)<PropsExtended>`
  position: fixed;
  color: ${colorMenu};
  transition: all 0.3s ease-in-out;
  background: ${(props) => (props.isScrollTop ? `transparent` : '#fff')};
  ${(props) => (props.isScrollTop ? `` : 'box-shadow: 1px 1px 20px #cce4f3;')}
  z-index: 2;
`;

function Header() {
  const [isScrollTop, setIsScrollTop] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      window.scrollY ? setIsScrollTop(false) : setIsScrollTop(true);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <HeaderBox
      role="menubar"
      direction="row"
      width="100%"
      justify="between"
      pad={{ horizontal: 'medium' }}
      isScrollTop={isScrollTop}
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
        <Text>John Doe</Text>
        <AvatarIcon width={42} height={42} />
      </Box>
    </HeaderBox>
  );
}

export default Header;
