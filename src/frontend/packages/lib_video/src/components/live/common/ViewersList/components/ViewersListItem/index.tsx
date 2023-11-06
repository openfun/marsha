import { Box, Text } from 'lib-components';
import React from 'react';

import { ChatAvatar } from '@lib-video/components/live/common/Chat/ChatAvatar';

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
      <Text size="small" weight={isInstructor ? 'bold' : 'medium'}>
        {name}
      </Text>
    </Box>
  );
};
