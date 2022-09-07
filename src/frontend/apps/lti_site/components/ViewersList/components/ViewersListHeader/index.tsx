import React from 'react';
import { Box, BoxProps, Text } from 'grommet';
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
    <Box align="start" {...boxProps}>
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
      >
        <StyledText color="blue-active" size="0.625rem" weight="normal">
          {text}
        </StyledText>
      </Box>
    </Box>
  );
};
