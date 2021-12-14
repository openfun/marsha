import { Box } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ChatConversationDisplayer } from 'components/Chat/SharedChatComponents/ChatConversationDisplayer';
import { InputBar } from 'components/Chat/SharedChatComponents/InputBar';
import { InputDisplayNameOverlay } from 'components/Chat/SharedChatComponents/InputDisplayNameOverlay';
import { JoinChatButton } from 'components/Chat/SharedChatComponents/JoinChatButton';
import { converse } from 'utils/window';

export const StudentChat = () => {
  const [overlay, setOverlay] = useState(false);
  const [isInputBarActive, setInputBarActive] = useState(false);
  const intl = useIntl();

  const processChatMessage = (chatMsg: string) => {
    converse.sendMessage(chatMsg);
    return true;
  };

  const messages = defineMessages({
    inputBarPlaceholder: {
      defaultMessage: 'Message...',
      description:
        'The input bar to write, edit and send messages to the chat conversation.',
      id: 'components.InputBar.inputBarPlaceholder',
    },
  });

  const handleJoinChatButton = () => {
    setOverlay(true);
  };

  return (
    <Box
      border={{
        color: 'blue',
        size: 'small',
      }}
      direction="column"
      fill
    >
      {overlay && (
        <InputDisplayNameOverlay
          setInputBarActive={setInputBarActive}
          setOverlay={setOverlay}
        />
      )}

      {
        // ChatConversationDisplayer display a spinner each time it is mounted,
        // so it can't be unmounted for now
      }
      <Box
        height="100%"
        style={{
          display: overlay ? 'none' : 'flex',
        }}
      >
        <ChatConversationDisplayer />
        <Box margin="10px">
          {isInputBarActive ? (
            <InputBar
              handleUserInput={processChatMessage}
              isChatInput={true}
              placeholderText={intl.formatMessage(messages.inputBarPlaceholder)}
            />
          ) : (
            <JoinChatButton handleClick={handleJoinChatButton} />
          )}
        </Box>
      </Box>
    </Box>
  );
};
