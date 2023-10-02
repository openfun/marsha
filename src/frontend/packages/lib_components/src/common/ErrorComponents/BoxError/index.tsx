import { Box } from 'grommet';
import { Alert } from 'grommet-icons';
import React from 'react';

import { Text } from '@lib-components/common/Text';

export const BoxError = ({ message }: { message: string }) => {
  return (
    <Box
      direction="row"
      align="center"
      justify="center"
      margin={{ bottom: 'medium' }}
      gap="small"
    >
      <Alert size="42rem" color="#df8c00" />
      <Text weight="bold">{message}</Text>
    </Box>
  );
};
