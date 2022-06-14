import { Box } from 'grommet';
import React, { useMemo } from 'react';

import { ChatMessage } from 'components/Chat/ChatMessage';
import { ChatMessageMetadatas } from 'components/Chat/ChatMessageMetadatas';
import { ChatMessageGroupType } from 'data/stores/useChatItemsStore';

interface ChatMessageGroupItemProps {
  msgGroup: ChatMessageGroupType;
}

export const ChatMessageGroupItem = ({
  msgGroup,
}: ChatMessageGroupItemProps) => {
  const firstMessage = msgGroup.messages[0];
  const memo = useMemo(
    () => (
      <Box
        margin={{
          vertical: '5px',
          horizontal: '20px',
        }}
      >
        <ChatMessageMetadatas
          msgDatetime={firstMessage.sentAt}
          msgSender={msgGroup.sender}
        />
        <Box gap="5px">
          {msgGroup.messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
        </Box>
      </Box>
    ),
    [msgGroup.sender, msgGroup.messages.length],
  );
  return memo;
};
