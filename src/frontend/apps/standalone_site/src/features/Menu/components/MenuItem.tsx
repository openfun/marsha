import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { Text } from 'lib-components';
import { Fragment, PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import { Route } from 'routes';

const NavLinkStyled = styled(NavLink)`
  text-decoration: none;
  color: ${normalizeColor('blue-active', theme)};
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease-in-out;
  &:active,
  &.active {
    background-color: ${normalizeColor('bg-menu-hover', theme)};
  }
  &:hover {
    background-color: var(--c--theme--colors--info-100);
  }
`;

interface MenuItemProps {
  route: Route;
}

const MenuItem = ({ route, children }: PropsWithChildren<MenuItemProps>) => {
  return (
    <Fragment>
      <NavLinkStyled to={route.path} role="menuitem" end={!route.isNavStrict}>
        {route.menuIcon}
        <Text weight="bold" size="large">
          {route.label}
        </Text>
      </NavLinkStyled>
      <div>{children}</div>
    </Fragment>
  );
};

export default MenuItem;
