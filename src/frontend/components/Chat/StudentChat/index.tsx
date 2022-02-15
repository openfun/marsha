import { Box, Spinner } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ChatConversationDisplayer } from 'components/Chat/SharedChatComponents/ChatConversationDisplayer';
import { InputBar } from 'components/Chat/SharedChatComponents/InputBar';
import { InputDisplayNameOverlay } from 'components/Chat/SharedChatComponents/InputDisplayNameOverlay';
import { JoinChatButton } from 'components/Chat/SharedChatComponents/JoinChatButton';
import { useChatItemState } from 'data/stores/useChatItemsStore';
import { converse } from 'utils/window';

export const StudentChat = () => {
  const displayName = useChatItemState((state) => state.displayName);
  const hasReceivedMessageHistory = useChatItemState(
    (state) => state.hasReceivedMessageHistory,
  );
  const [overlay, setOverlay] = useState(false);
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
    <Box direction="column" fill>
      {overlay ? (
        <InputDisplayNameOverlay setOverlay={setOverlay} />
      ) : (
        <Box direction="column" fill>
          {!hasReceivedMessageHistory ? (
            <Box align="center" fill justify="center">
              <Spinner size="large" />
            </Box>
          ) : (
            <ChatConversationDisplayer />
          )}
          <Box margin="10px">
            {displayName ? (
              <InputBar
                handleUserInput={processChatMessage}
                isChatInput={true}
                placeholderText={intl.formatMessage(
                  messages.inputBarPlaceholder,
                )}
              />
            ) : (
              <JoinChatButton
                disabled={!hasReceivedMessageHistory}
                handleClick={handleJoinChatButton}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
