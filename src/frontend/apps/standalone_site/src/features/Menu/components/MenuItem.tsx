import { Box, Text } from 'grommet';
import React, { Fragment, PropsWithChildren } from 'react';

interface MenuItemProps {
  icon: React.ReactNode;
  routeLabel: string;
  isActive?: boolean;
}

function MenuItem({
  icon,
  routeLabel,
  isActive,
  children,
}: PropsWithChildren<MenuItemProps>) {
  return (
    <Fragment>
      <Box
        pad={{ horizontal: 'small', vertical: 'xsmall' }}
        gap="small"
        round="xsmall"
        align="center"
        role="menuitem"
        direction="row"
        background={isActive ? { color: 'bg-menu-hover' } : undefined}
      >
        {icon}
        <Text size="0.938rem" weight="bold">
          {routeLabel}
        </Text>
      </Box>
      <div>{children}</div>
    </Fragment>
  );
}

export default MenuItem;
