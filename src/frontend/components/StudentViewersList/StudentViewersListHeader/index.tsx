import React from 'react';
import { Box, Text } from 'grommet';
import styled from 'styled-components';

const StyledTextHeader = styled(Text)`
  font-family: 'Roboto-Regular';
  letter-spacing: -0.2px;
`;

interface StudentViewersListHeaderProps {
  text: string;
}

export const StudentViewersListHeader = ({
  text,
}: StudentViewersListHeaderProps) => {
  return (
    <Box
      align="start"
      margin={{
        bottom: '6px',
      }}
    >
      <Box
        align="center"
        border={{
          color: 'blue-active',
          size: 'xsmall',
        }}
        pad={{
          horizontal: '12px',
          vertical: '2px',
        }}
        round="14px"
      >
        <StyledTextHeader color="blue-active" size="10px" weight="normal">
          {text}
        </StyledTextHeader>
      </Box>
    </Box>
  );
};
