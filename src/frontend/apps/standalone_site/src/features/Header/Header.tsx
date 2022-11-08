import { Box, Text, ResponsiveContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import { forwardRef, useEffect, useState, useContext } from 'react';
import styled from 'styled-components';

import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';
import { Burger } from 'features/Menu';

const colorMenu = normalizeColor('blue-active', theme);

interface PropsExtended {
  isScrollTop: boolean;
  breakpoint: string;
}

const HeaderBox = styled(Box)<PropsExtended>`
  position: fixed;
  color: ${colorMenu};
  transition: all 0.3s ease-in-out;
  ${(props) =>
    props.isScrollTop && props.breakpoint !== 'small'
      ? `background: transparent;`
      : `
        background: #fff;
        box-shadow: 1px 1px 20px #cce4f3;
      `}
  z-index: 2;
`;

const Header = forwardRef<Nullable<HTMLDivElement>>((_props, ref) => {
  const [isScrollTop, setIsScrollTop] = useState(true);
  const breakpoint = useContext(ResponsiveContext);

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
      breakpoint={breakpoint}
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
});

Header.displayName = 'Header';
export default Header;
