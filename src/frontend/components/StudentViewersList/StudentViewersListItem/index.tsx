import { Box, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { ChatAvatar } from 'components/Chat/SharedChatComponents/ChatAvatar';

const StyledText = styled(Text)`
  font-family: 'Roboto-Medium';
  letter-spacing: 0.07px;
`;

interface StudentViewersListItemProps {
  isInstructor: boolean;
  name: string;
}

export const StudentViewersListItem = ({
  isInstructor,
  name,
}: StudentViewersListItemProps) => {
  return (
    <Box align="center" direction="row" gap="10px">
      <ChatAvatar isInstructor={isInstructor} />
      <StyledText
        color="blue-active"
        size="12px"
        weight={isInstructor ? 'bold' : 'normal'}
      >
        {name}
      </StyledText>
    </Box>
  );
};
