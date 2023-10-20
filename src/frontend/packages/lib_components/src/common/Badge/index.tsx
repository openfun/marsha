import { Box, BoxExtendedProps } from 'grommet';
import { colorsTokens } from 'lib-common';
import React from 'react';
import styled from 'styled-components';

import { Text } from '@lib-components/common/Text';

const StyledBadge = styled(Box)`
  position: absolute;
  top: 0px;
  right: 0px;
  background-color: ${colorsTokens['primary-500']};
  border-radius: 60px;
  height: 22px;
  width: 22px;
  justify-content: center;
  align-items: center;
`;

interface BadgeProps extends BoxExtendedProps {
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
    <StyledBadge
      data-testid="badge_container"
      style={{
        top: position?.top,
        right: position?.right,
        ...moreStyle,
        ...style,
      }}
      {...props}
    >
      <Text size="tiny" color="white">
        {value}
      </Text>
    </StyledBadge>
  );
};
