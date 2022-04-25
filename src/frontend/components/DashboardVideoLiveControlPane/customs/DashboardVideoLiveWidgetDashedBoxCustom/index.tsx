import { Box } from 'grommet';
import React from 'react';

interface DashboardVideoLiveWidgetDashedBoxCustomProps {
  children: React.ReactNode | React.ReactNode[];
}

export const DashboardVideoLiveWidgetDashedBoxCustom = ({
  children,
}: DashboardVideoLiveWidgetDashedBoxCustomProps) => {
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
