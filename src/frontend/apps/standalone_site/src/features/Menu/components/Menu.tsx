import { Box, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { useResponsive } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Route, routes } from 'routes';

import { useMenu } from '../store/menuStore';

import MenuItem from './MenuItem';

const messages = defineMessages({
  menuTypeContentLabel: {
    defaultMessage: 'TYPES OF CONTENT',
    description: 'Label types of content in the menu',
    id: 'features.Menu.menuTypeContentLabel',
  },
});

const colorMenu = normalizeColor('blue-active', theme);
const sizeMenu = '18.75rem';

interface PropsExtended {
  isMenuOpen: boolean;
  isDesktop: boolean;
}

const MenuBox = styled(Box)<PropsExtended>`
  box-shadow: 0px 0px 4px 0px rgba(104, 111, 122, 0.3);
  z-index: 1;
  transition: margin-left 0.6s;
  ${(props) => (props.isMenuOpen ? `` : `margin-left: -${sizeMenu};`)}
  ${(props) =>
    !props.isDesktop
      ? `
        position: fixed;
        background-color: white;
        height: 100vh;
      `
      : ``}
`;

const Menu = () => {
  const intl = useIntl();
  const { isDesktop } = useResponsive();
  const { isMenuOpen } = useMenu();
  const topRoutes: Route[] = [routes.HOMEPAGE, routes.PROFILE];
  const contents: Route[] = [routes.PLAYLIST, routes.CONTENTS];

  return (
    <MenuBox
      role="menu"
      width={`${sizeMenu}`}
      pad={{
        vertical: '0.625rem',
        left: '0.825rem',
        right: '3.75rem',
        top: '6.75rem',
      }}
      isMenuOpen={isMenuOpen(isDesktop)}
      isDesktop={isDesktop}
    >
      <Box role="group">
        {topRoutes.map((route, index) => (
          <MenuItem key={`menuItemRoute-${index}`} route={route} />
        ))}
      </Box>
      <Box
        height="1px"
        background={{ color: `${colorMenu}26` }}
        margin={{ vertical: 'medium', horizontal: 'xxsmall' }}
      />
      <Box role="group">
        <Text size="small" weight="bold" margin={{ left: '1rem' }}>
          {intl.formatMessage(messages.menuTypeContentLabel)}
        </Text>
        {contents.map((content, index) => (
          <MenuItem key={`menuItemContent-${index}`} route={content}>
            {content.subRoutes && (
              <Box margin={{ left: '2.6rem' }}>
                {Object.values(content.subRoutes)
                  .filter((subRoute) => !subRoute.hideSubRoute)
                  .map((subRoutes, subIndex) => (
                    <MenuItem
                      key={`menuItemSubContent-${subIndex}`}
                      route={subRoutes}
                    />
                  ))}
              </Box>
            )}
          </MenuItem>
        ))}
      </Box>
    </MenuBox>
  );
};

export default Menu;
