import { colorsTokens } from '@lib-common/cunningham';
import { Box, BoxProps } from 'lib-components';
import React from 'react';

interface BigDashedBoxProps extends BoxProps<'div'> {
  children: React.ReactNode | React.ReactNode[];
}

export const BigDashedBox = ({ children, ...boxProps }: BigDashedBoxProps) => {
  return (
    <Box
      align="center"
      background={colorsTokens['primary-150']}
      justify="center"
      gap="medium"
      pad="large"
      round="small"
      {...boxProps}
      style={{
        border: `2px dashed ${colorsTokens['primary-500']}`,
        ...boxProps.style,
      }}
    >
      {children}
    </Box>
  );
};
