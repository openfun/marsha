import { Box, BoxExtendedProps } from 'grommet';
import { Alert } from 'grommet-icons';
import React, { PropsWithChildren, ReactNode } from 'react';

import { Text } from '@lib-components/common/Text';

interface BoxErrorProps extends BoxExtendedProps {
  message: ReactNode;
}

export const BoxError = ({
  message,
  children,
  ...props
}: PropsWithChildren<BoxErrorProps>) => {
  return (
    <Box margin={{ bottom: 'small' }}>
      <Box
        direction="row"
        align="center"
        justify="center"
        gap="small"
        {...props}
      >
        <Alert size="42rem" color="#df8c00" />
        <Text weight="bold">{message}</Text>
      </Box>
      {children}
    </Box>
  );
};
