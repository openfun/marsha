import { Input } from '@openfun/cunningham-react';
import { Box, Spinner } from 'grommet';
import { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useChatItemState } from '@lib-video/hooks/useChatItemsStore';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { useSetDisplayName } from '@lib-video/hooks/useSetDisplayName';
import { converse } from '@lib-video/utils/window';

import { ChatConversationDisplayer } from '../ChatConversationDisplayer';
import { JoinChatButton } from '../JoinChatButton';

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
  const [chatmessage, setChatmessage] = useState('');

  const processChatMessage = () => {
    converse.sendMessage(chatmessage);
    setChatmessage('');
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
    <Box direction="column" fill overflow="auto">
      {!hasReceivedMessageHistory ? (
        <Box align="center" fill justify="center">
          <Spinner size="large" />
        </Box>
      ) : (
        <ChatConversationDisplayer />
      )}
      {!isModerated && (
        <Box margin="small" height={{ min: 'auto' }}>
          {liveSession?.display_name ? (
            <Input
              rightIcon={
                <span
                  className="material-icons"
                  onClick={() => processChatMessage()}
                  style={{
                    cursor: 'pointer',
                  }}
                >
                  send
                </span>
              }
              aria-label={intl.formatMessage(messages.inputBarPlaceholder)}
              label={intl.formatMessage(messages.inputBarPlaceholder)}
              fullWidth
              value={chatmessage}
              onChange={(event) => setChatmessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  processChatMessage();
                }
              }}
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
  );
};
