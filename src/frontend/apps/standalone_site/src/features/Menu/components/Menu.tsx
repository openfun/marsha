import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Route, routes } from 'routes';
import { Text, Box } from 'styles/StyledGrommet';

import { useMenu } from '../store/menuStore';

import MenuItem from './MenuItem';

const messages = defineMessages({
  typeContentLabel: {
    defaultMessage: 'Types of content',
    description: 'Label for the types of content in the menu',
    id: 'features.Menu.typeContentLabel',
  },
});

const colorMenu = normalizeColor('blue-active', theme);

function Menu() {
  const intl = useIntl();
  const { isMenuOpen } = useMenu();
  const sizeMenu = '18.75rem';
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
    <Box
      role="menu"
      width={`${sizeMenu}`}
      pad={{
        vertical: '0.625rem',
        left: '0.825rem',
        right: '3.75rem',
        top: '6.75rem',
      }}
      css={`
        box-shadow: 0px 0px 4px 0px rgba(104, 111, 122, 0.3);
        z-index: 1;
        transition: margin-left 0.6s;
        ${isMenuOpen ? `` : `margin-left: -${sizeMenu};`}
      `}
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
        <Text
          size="small"
          weight="bold"
          margin={{ left: '1rem' }}
          css="text-transform: 'uppercase';"
        >
          {intl.formatMessage(messages.typeContentLabel)}
        </Text>
        {contents.map((content, index) => (
          <MenuItem key={`menuItemContent-${index}`} route={content}>
            {content.subRoutes && (
              <Box margin={{ left: '2.6rem' }}>
                {content.subRoutes.map((subRoutes, subIndex) => (
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
    </Box>
  );
}

export default Menu;
