import { colorsTokens } from '@lib-common/cunningham';
import { Box, BoxProps, Text } from 'lib-components';
import React from 'react';

interface ViewersListHeaderProps extends BoxProps<'div'> {
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
        style={{
          border: `1px solid ${colorsTokens['info-500']}`,
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
