import { Box } from 'grommet';
import React from 'react';

interface DashedBoxCustomProps {
  children: React.ReactNode | React.ReactNode[];
}

export const DashedBoxCustom = ({ children }: DashedBoxCustomProps) => {
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
