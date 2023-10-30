import { colorsTokens } from 'lib-common';
import React from 'react';

import { Text } from '@lib-components/common/Text';

import { Box, BoxProps } from '../Box';

interface BadgeProps extends Omit<BoxProps<'div'>, 'position'> {
  value: string;
  position?: {
    top: string;
    right: string;
  };
  size?: 'small' | 'medium' | 'large';
}

export const Badge = ({
  value,
  position,
  style,
  size,
  ...props
}: BadgeProps) => {
  let moreStyle = {};
  if (size === 'small') {
    moreStyle = { height: '16px', width: '16px' };
  } else if (size === 'large') {
    moreStyle = { height: '26px', width: '26px' };
  }

  return (
    <Box
      data-testid="badge_container"
      background={colorsTokens['primary-500']}
      round="full"
      height="22px"
      width="22px"
      justify="center"
      align="center"
      style={{
        position: 'absolute',
        top: position?.top || '0px',
        right: position?.right || '0px',
        ...moreStyle,
        ...style,
      }}
      {...props}
    >
      <Text size="tiny" color="white">
        {value}
      </Text>
    </Box>
  );
};
