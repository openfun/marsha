import { Box, BoxExtendedProps } from 'grommet';
import React from 'react';

interface BigDashedBoxProps extends BoxExtendedProps {
  children: React.ReactNode | React.ReactNode[];
}

export const BigDashedBox = ({ children, ...boxProps }: BigDashedBoxProps) => {
  return (
    <Box
      align="center"
      background="bg-select"
      border={{ color: 'blue-active', size: 'small', style: 'dashed' }}
      direction="column"
      justify="center"
      gap="medium"
      pad="large"
      round="small"
      {...boxProps}
    >
      {children}
    </Box>
  );
};
