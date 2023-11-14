import { colorsTokens } from '@lib-common/cunningham';
import { Box, Text, Typo } from 'lib-components';
import * as linkify from 'linkifyjs';
import React, { useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ChatMessageType } from '@lib-video/hooks/useChatItemsStore';

const messages = defineMessages({
  sentAt: {
    defaultMessage: 'sent at {sentAt}',
    description: "'Sent at' text for message's datetime display.",
    id: 'component.ChatMessage.sentAt',
  },
});

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const intl = useIntl();
  const messageTokens = linkify.tokenize(message.content);
  const memo = useMemo(
    () => (
      <Box
        background={colorsTokens['primary-100']}
        pad="5px"
        round="xsmall"
        title={intl.formatMessage(messages.sentAt, {
          sentAt: message.sentAt.toFormat('HH:mm:ss'),
        })}
      >
        <Text>
          {messageTokens.length > 0
            ? messageTokens.map((token, index) => {
                if (token.t === 'text') {
                  return token.toString();
                } else {
                  return (
                    <Typo
                      type="a"
                      href={token.toHref()}
                      key={index}
                      target="_blank"
                      rel="noopener noreferrer"
                      color={colorsTokens['primary-500']}
                    >
                      {token.toString()}
                    </Typo>
                  );
                }
              })
            : message.content}
        </Text>
      </Box>
    ),
    [message, intl, messageTokens],
  );
  return memo;
};
