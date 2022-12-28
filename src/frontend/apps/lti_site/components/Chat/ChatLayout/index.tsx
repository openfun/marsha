import { Box, Spinner } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ChatConversationDisplayer } from 'components/Chat/ChatConversationDisplayer';
import { InputBar } from 'components/Chat/InputBar';
import { JoinChatButton } from 'components/Chat/JoinChatButton';
import { useChatItemState } from 'data/stores/useChatItemsStore';
import { converse } from 'utils/window';
import { useLiveSession } from 'data/stores/useLiveSession';
import { useSetDisplayName } from 'data/stores/useSetDisplayName';

export interface ChatLayoutProps {
  isModerated: boolean;
}

export const ChatLayout = ({ isModerated }: ChatLayoutProps) => {
  const liveSession = useLiveSession((state) => state.liveSession);
  const [_, setDisplayName] = useSetDisplayName();
  const hasReceivedMessageHistory = useChatItemState(
    (state) => state.hasReceivedMessageHistory,
  );
  const intl = useIntl();

  const processChatMessage = (chatMsg: string) => {
    converse.sendMessage(chatMsg);
    return Promise.resolve(true);
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
    setDisplayName(true);
  };

  return (
    <Box direction="column" fill>
      <Box direction="column" fill>
        {!hasReceivedMessageHistory ? (
          <Box align="center" fill justify="center">
            <Spinner size="large" />
          </Box>
        ) : (
          <ChatConversationDisplayer />
        )}
        {!isModerated && (
          <Box margin="small">
            {liveSession?.display_name ? (
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
        )}
      </Box>
    </Box>
  );
};
