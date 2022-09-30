import { Box, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import styled from 'styled-components';

import { Route, routes } from 'routes';

import MenuItem from './MenuItem';

const colorMenu = normalizeColor('blue-active', theme);

const MenuBox = styled(Box)`
  box-shadow: 0px 0px 4px 0px rgba(104, 111, 122, 0.3);
  z-index: 1;
`;

function Menu() {
  const topRoutes: Route[] = [
    routes.HomePage,
    routes.Favorites,
    routes.MyProfile,
  ];
  const contents: Route[] = [
    routes.MyPlaylist,
    routes.MyOrganizations,
    routes.MyContents,
  ];

  return (
    <MenuBox
      role="menu"
      width="18.75rem"
      pad={{
        vertical: '0.625rem',
        left: '0.825rem',
        right: '3.75rem',
        top: '6.75rem',
      }}
    >
      <Box role="group">
        {topRoutes.map((route) => (
          <MenuItem key={`menuItemRoute-${route.label}`} route={route} />
        ))}
      </Box>
      <Box
        height="1px"
        background={{ color: `${colorMenu}26` }}
        margin={{ vertical: 'medium', horizontal: 'xxsmall' }}
      />
      <Box role="group">
        <Text size="small" weight="bold" margin={{ left: '1rem' }}>
          TYPES DE CONTENUS
        </Text>
        {contents.map((content) => (
          <MenuItem key={`menuItemContent-${content.label}`} route={content}>
            {content.subRoutes && (
              <Box margin={{ left: '2.6rem' }}>
                {content.subRoutes.map((subRoutes) => (
                  <MenuItem
                    key={`menuItemSubContent-${subRoutes.label}`}
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
}

export default Menu;
