import { Box, BoxExtendedProps } from 'grommet';
import { Alert } from 'grommet-icons';
import React from 'react';

import { Text } from '@lib-components/common/Text';

interface BoxErrorProps extends BoxExtendedProps {
  message: string;
}

export const BoxError = ({ message, ...props }: BoxErrorProps) => {
  return (
    <Box
      direction="row"
      align="center"
      justify="center"
      margin={{ bottom: 'medium' }}
      gap="small"
      {...props}
    >
      <Alert size="42rem" color="#df8c00" />
      <Text weight="bold">{message}</Text>
    </Box>
  );
};
