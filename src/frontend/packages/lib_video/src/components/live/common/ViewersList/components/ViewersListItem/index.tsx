import { Box, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { ChatAvatar } from '@lib-video/components/live/common/Chat/ChatAvatar';

const StyledText = styled(Text)`
  font-family: 'Roboto-Medium';
  letter-spacing: 0.07px;
`;

interface ViewersListItemProps {
  isInstructor: boolean;
  name: string;
}

export const ViewersListItem = ({
  isInstructor,
  name,
}: ViewersListItemProps) => {
  return (
    <Box align="center" direction="row" gap="10px">
      <ChatAvatar isInstructor={isInstructor} />
      <StyledText
        color="blue-active"
        size="0.75rem"
        weight={isInstructor ? 'bold' : 'normal'}
      >
        {name}
      </StyledText>
    </Box>
  );
};
