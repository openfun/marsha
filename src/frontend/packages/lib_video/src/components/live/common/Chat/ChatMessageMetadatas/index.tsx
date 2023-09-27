import { Box } from 'grommet';
import { Text } from 'lib-components';
import { DateTime } from 'luxon';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ChatAvatar } from '../ChatAvatar';

interface ChatMessageMetadatasProps {
  msgDatetime: DateTime;
  msgSender: string;
}

const messages = defineMessages({
  senderTitle: {
    defaultMessage: "The name of the message's sender",
    description:
      "A title describing the div where the sender's name is displayed",
    id: 'component.MessageMetadatas.senderTitle',
  },
  messageTimeTitle: {
    defaultMessage: 'The time at which the message was sent',
    description:
      'A title describing the div where the sending time is displayed',
    id: 'component.MessageMetadatas.messageTimeTitle',
  },
});

export const ChatMessageMetadatas = ({
  msgDatetime,
  msgSender,
}: ChatMessageMetadatasProps) => {
  const intl = useIntl();
  return (
    <Box
      align="center"
      direction="row"
      height="24px"
      margin={{
        bottom: '9px',
      }}
      width={{ min: 'auto' }}
    >
      <Box width={{ min: 'auto' }}>
        <ChatAvatar />
      </Box>
      <Box
        margin={{
          left: '10px',
        }}
        width={{ min: 'auto', max: 'calc(100% - 70px)' }}
      >
        <Text
          title={intl.formatMessage(messages.senderTitle)}
          truncate={true}
          weight="medium"
        >
          {msgSender}
        </Text>
      </Box>
      <Box
        direction="row-reverse"
        margin={{
          left: '5px',
        }}
        width="100%"
      >
        <Text title={intl.formatMessage(messages.messageTimeTitle)} size="tiny">
          {msgDatetime.toFormat('(HH:mm)')}
        </Text>
      </Box>
    </Box>
  );
};
