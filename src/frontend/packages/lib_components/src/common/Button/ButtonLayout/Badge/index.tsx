import { Box, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useContext } from 'react';
import styled from 'styled-components';

import { Text } from '@lib-components/common/Text';

interface ComponentWithTheme {
  grommetTheme: object;
}

const StyledBadge = styled(Box)<ComponentWithTheme>`
  background-color: ${(props) => normalizeColor('white', props.grommetTheme)};
  border: 1px solid
    ${(props) => normalizeColor('blue-focus', props.grommetTheme)};
  border-radius: 6px;
  bottom: 0px;
  color: ${(props) => normalizeColor('blue-focus', props.grommetTheme)};
  font-family: 'Roboto-Bold';
  padding: 1px 3px;
  position: absolute;
  right: -8px;
`;

interface BadgeProps {
  value: string;
}

export const Badge = ({ value }: BadgeProps) => {
  const theme = useContext(ThemeContext);

  return (
    <StyledBadge data-testid="badge_container" grommetTheme={theme}>
      <Text size="tiny">{value}</Text>
    </StyledBadge>
  );
};
