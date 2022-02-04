import { Box, BoxProps } from 'grommet';
import React from 'react';

export const AdvertisingBox: React.FunctionComponent<BoxProps> = ({
  children,
  ...boxProps
}) => {
  return (
    <Box
      background="white"
      fill
      margin="medium"
      pad="small"
      round="6px"
      style={{
        boxShadow: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
      }}
      {...boxProps}
    >
      {children}
    </Box>
  );
};
