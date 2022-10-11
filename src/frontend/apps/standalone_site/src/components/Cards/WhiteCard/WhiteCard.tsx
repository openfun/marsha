import { Box, BoxProps } from 'grommet';
import { PropsWithChildren } from 'react';

export const WhiteCard = ({
  children,
  ...boxProps
}: PropsWithChildren<BoxProps>) => {
  return (
    <Box
      background="white"
      elevation="even"
      flex
      round="small"
      pad="medium"
      {...boxProps}
    >
      {children}
    </Box>
  );
};
