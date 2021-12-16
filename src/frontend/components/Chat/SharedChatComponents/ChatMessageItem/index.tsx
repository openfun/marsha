import { Box } from 'grommet';
import React from 'react';

import { ChatMessageContent } from 'components/Chat/SharedChatComponents/ChatMessageContent';
import { ChatMessageMetadatas } from 'components/Chat/SharedChatComponents/ChatMessageMetadatas';
import { ChatMessageType } from 'data/stores/useMessagesStore/index';

interface ChatMessageItemProps {
  msg: ChatMessageType;
}

export const ChatMessageItem = ({ msg }: ChatMessageItemProps) => {
  return (
    <Box
      margin={{
        vertical: '5px',
        horizontal: '20px',
      }}
    >
      <ChatMessageMetadatas msgDatetime={msg.sentAt} msgSender={msg.sender} />
      <ChatMessageContent messageContent={msg.content} />
    </Box>
  );
};
