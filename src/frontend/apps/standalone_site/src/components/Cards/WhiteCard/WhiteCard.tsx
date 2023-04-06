import { Box, BoxExtendedProps } from 'grommet';
import { PropsWithChildren } from 'react';

export const WhiteCard = ({
  children,
  ...boxProps
}: PropsWithChildren<BoxExtendedProps>) => {
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
