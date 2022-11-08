import { Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { PropsWithChildren, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { Route } from 'routes';
import { themeBase, themeExtend } from 'styles/theme.extend';

const NavLinkStyled = styled(NavLink)`
  text-decoration: none;
  color: ${normalizeColor('blue-active', themeBase)};
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease-in-out;
  &:active,
  &.active {
    background-color: ${normalizeColor('bg-menu-hover', themeExtend)};
  }
`;

interface MenuItemProps {
  route: Route;
}

function MenuItem({ route, children }: PropsWithChildren<MenuItemProps>) {
  return (
    <Fragment>
      <NavLinkStyled exact to={route.path} role="menuitem">
        {route.menuIcon}
        <Text size="0.938rem" weight="bold">
          {route.label}
        </Text>
      </NavLinkStyled>
      <div>{children}</div>
    </Fragment>
  );
}

export default MenuItem;
