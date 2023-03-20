import { Box, BoxProps, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

const StyledText = styled(Text)`
  font-family: 'Roboto-Regular';
  letter-spacing: -0.2px;
`;

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
        <StyledText color="blue-active" size="0.625rem" weight="normal">
          {text}
        </StyledText>
      </Box>
    </Box>
  );
};
