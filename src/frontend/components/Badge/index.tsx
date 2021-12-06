import React from 'react';
import { Box, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { theme } from 'utils/theme/theme';

const StyledBadge = styled(Box)`
  background-color: ${normalizeColor('white', theme)};
  border: 1px solid ${normalizeColor('blue-focus', theme)};
  border-radius: 6px;
  bottom: 2px;
  color: ${normalizeColor('blue-focus', theme)};
  font-weight: bold;
  padding: 3px 6px;
  position: absolute;
  right: -8px;
`;

interface BadgeProps {
  value: number;
}

export const Badge = ({ value }: BadgeProps) => {
  return (
    <StyledBadge role="badge_container">
      <Text size="0.6rem">{value}</Text>
    </StyledBadge>
  );
};
