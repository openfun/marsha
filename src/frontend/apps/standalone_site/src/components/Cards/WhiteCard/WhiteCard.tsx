import { Box, BoxProps } from 'lib-components';
import { PropsWithChildren } from 'react';

export const WhiteCard = ({
  children,
  ...boxProps
}: PropsWithChildren<BoxProps<'div'>>) => {
  return (
    <Box background="white" elevation round="small" pad="small" {...boxProps}>
      {children}
    </Box>
  );
};
