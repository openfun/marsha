import { Box } from 'grommet';
import React from 'react';

import { ChatConversationDisplayer } from 'components/Chat/SharedChatComponents/ChatConversationDisplayer';
import { ChatInputBar } from 'components/Chat/SharedChatComponents/ChatInputBar';

export const StudentChat = () => {
  return (
    <Box
      direction="column"
      border={{
        color: 'blue',
        size: 'small',
      }}
      height="medium"
    >
      <ChatConversationDisplayer />
      <ChatInputBar />
    </Box>
  );
};
