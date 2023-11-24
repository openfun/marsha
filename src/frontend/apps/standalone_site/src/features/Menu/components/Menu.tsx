import { colorsTokens } from 'lib-common';
import { Box, Text, useResponsive } from 'lib-components';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Route, useRoutes } from 'routes';

import { useMenu } from '../store/menuStore';

import MenuItem from './MenuItem';

const messages = defineMessages({
  menuTypeContentLabel: {
    defaultMessage: 'TYPES OF CONTENT',
    description: 'Label types of content in the menu',
    id: 'features.Menu.menuTypeContentLabel',
  },
});

const colorMenu = colorsTokens['info-500'];
const sizeMenu = '18.75rem';

interface PropsExtended {
  $isMenuOpen: boolean;
  $isDesktop: boolean;
}

const MenuBox = styled(Box)<PropsExtended>`
  box-shadow: 0px -4px 4px 0px rgba(104, 111, 122, 0.3);
  z-index: 10;
  transition: margin-left 0.6s;
  background: linear-gradient(
    to bottom,
    #ffffff 0%,
    #ffffff 83%,
    #ffffff00 100%
  );
  ${(props) => (props.$isMenuOpen ? `` : `margin-left: -${sizeMenu};`)}
  ${(props) =>
    !props.$isDesktop
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
  const routes = useRoutes();
  const topRoutes: Route[] = [routes.HOMEPAGE, routes.PROFILE];
  const contents: Route[] = [routes.PLAYLIST, routes.CONTENTS];

  return (
    <MenuBox
      pad={{
        top: '6.75rem',
        bottom: 'small',
        left: 'small',
        right: 'medium',
      }}
      role="menu"
      width={sizeMenu}
      $isMenuOpen={isMenuOpen(isDesktop)}
      $isDesktop={isDesktop}
      style={{ flexShrink: 0 }}
    >
      <Box role="group">
        {topRoutes.map((route, index) => (
          <MenuItem key={`menuItemRoute-${index}`} route={route} />
        ))}
      </Box>
      <Box
        height="1px"
        background={`${colorMenu}26`}
        margin={{ vertical: 'medium', horizontal: 'small' }}
      />
      <Box role="group">
        <Text
          weight="bold"
          margin={{ bottom: 'xxsmall' }}
          transform="uppercase"
        >
          {intl.formatMessage(messages.menuTypeContentLabel)}
        </Text>
        {contents.map((content, index) => (
          <MenuItem key={`menuItemContent-${index}`} route={content}>
            {content.subRoutes && (
              <Box margin={{ left: 'xmedium' }}>
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
