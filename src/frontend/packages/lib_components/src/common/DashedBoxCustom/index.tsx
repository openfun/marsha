import { colorsTokens } from 'lib-common';
import React from 'react';

import { Box } from '../Box';

interface DashedBoxCustomProps {
  children: React.ReactNode | React.ReactNode[];
}

export const DashedBoxCustom = ({ children }: DashedBoxCustomProps) => {
  return (
    <Box
      align="center"
      style={{
        border: `${colorsTokens['primary-500']} 1px dashed`,
      }}
      direction="row"
      justify="space-between"
      pad={{ horizontal: 'medium', vertical: 'xsmall' }}
      round="xsmall"
      gap="small"
    >
      {children}
    </Box>
  );
};
