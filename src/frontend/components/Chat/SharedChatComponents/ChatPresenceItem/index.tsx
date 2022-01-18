import { Box, Text } from 'grommet';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { ChatPresenceType, presenceType } from 'data/stores/useChatItemsStore';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  joinedChatLabel: {
    defaultMessage: '{participant} has joined',
    description: 'A label to announce that a user has joined the chat.',
    id: 'component.ChatPresenceItem.joinedChatLabel',
  },
  leftChatLabel: {
    defaultMessage: '{participant} has left',
    description: 'A label to announce that a user has left the chat.',
    id: 'component.ChatPresenceItem.leftChatLabel',
  },
});

const TextStyled = styled(Text)`
  font-family: Roboto-Regular;
`;

interface ChatPresenceItemProps {
  presenceItem: ChatPresenceType;
}

export const ChatPresenceItem = ({ presenceItem }: ChatPresenceItemProps) => {
  const intl = useIntl();
  const memo = useMemo(
    () => (
      <Box
        align="center"
        margin={{
          horizontal: '20px',
          vertical: '5px',
        }}
      >
        <Box
          align="center"
          border={{
            color: 'blue-chat',
            size: 'xsmall',
          }}
          margin={{
            horizontal: '20px',
          }}
          pad={{
            horizontal: '5px',
            vertical: '2px',
          }}
          round="12px"
        >
          <TextStyled color="blue-chat" size="0.625rem">
            {presenceItem.type === presenceType.ARRIVAL
              ? intl.formatMessage(messages.joinedChatLabel, {
                  participant: presenceItem.sender,
                })
              : intl.formatMessage(messages.leftChatLabel, {
                  participant: presenceItem.sender,
                })}
          </TextStyled>
        </Box>
      </Box>
    ),
    [presenceItem, intl],
  );
  return memo;
};
