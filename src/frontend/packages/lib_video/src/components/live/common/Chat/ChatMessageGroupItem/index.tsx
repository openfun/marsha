import { Box } from 'grommet';
import React from 'react';

import { ChatMessageGroupType } from '@lib-video/hooks/useChatItemsStore';

import { ChatMessage } from '../ChatMessage';
import { ChatMessageMetadatas } from '../ChatMessageMetadatas';

interface ChatMessageGroupItemProps {
  msgGroup: ChatMessageGroupType;
}

export const ChatMessageGroupItem = ({
  msgGroup,
}: ChatMessageGroupItemProps) => {
  const firstMessage = msgGroup.messages[0];
  return (
    <Box
      margin={{
        vertical: '5px',
        horizontal: '20px',
      }}
      height={{ min: 'auto' }}
    >
      <ChatMessageMetadatas
        msgDatetime={firstMessage.sentAt}
        msgSender={msgGroup.sender}
      />
      <Box gap="5px" height={{ min: 'auto' }}>
        {msgGroup.messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </Box>
    </Box>
  );
};
