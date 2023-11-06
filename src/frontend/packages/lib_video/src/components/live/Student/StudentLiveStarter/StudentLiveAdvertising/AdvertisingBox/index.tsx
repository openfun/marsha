import { Box, BoxProps } from 'lib-components';
import React, { PropsWithChildren } from 'react';

export const AdvertisingBox = ({
  children,
  ...boxProps
}: PropsWithChildren<BoxProps<'div'>>) => {
  return (
    <Box
      background="white"
      fill
      margin="medium"
      pad="small"
      round="6px"
      {...boxProps}
      style={{
        boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
        ...boxProps.style,
      }}
    >
      {children}
    </Box>
  );
};
