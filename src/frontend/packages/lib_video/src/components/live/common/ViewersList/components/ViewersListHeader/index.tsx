import { Box, BoxProps } from 'grommet';
import { Text } from 'lib-components';
import React from 'react';

interface ViewersListHeaderProps extends BoxProps {
  text: string;
}

export const ViewersListHeader = ({
  text,
  ...boxProps
}: ViewersListHeaderProps) => {
  return (
    <Box align="start" {...boxProps} height={{ min: 'auto' }}>
      <Box
        align="center"
        border={{
          color: 'blue-active',
          size: 'xsmall',
        }}
        pad={{
          horizontal: 'small',
          vertical: '2px',
        }}
        round="14px"
        height={{ min: 'auto' }}
      >
        <Text size="tiny">{text}</Text>
      </Box>
    </Box>
  );
};
