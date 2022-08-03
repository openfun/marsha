import { Box } from 'grommet';
import React from 'react';

interface DashboardLiveWidgetDashedBoxCustomProps {
  children: React.ReactNode | React.ReactNode[];
}

export const DashboardLiveWidgetDashedBoxCustom = ({
  children,
}: DashboardLiveWidgetDashedBoxCustomProps) => {
  return (
    <Box
      align="center"
      border={{
        color: 'blue-off',
        size: 'xsmall',
        style: 'dashed',
      }}
      direction="row"
      justify="between"
      pad={{ horizontal: 'medium', vertical: 'small' }}
      round="xsmall"
      gap="small"
    >
      {children}
    </Box>
  );
};
