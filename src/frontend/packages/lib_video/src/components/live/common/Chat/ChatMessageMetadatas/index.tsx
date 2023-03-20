import { Box, Text } from 'grommet';
import { chatFonts } from 'lib-common';
import { DateTime } from 'luxon';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

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

const SenderNameTextStyled = styled(Text)`
  letter-spacing: ${chatFonts.primary.letterSpacing};
  line-height: ${chatFonts.primary.lineHeight};
  font-family: ${chatFonts.primary.fontFamily};
`;

const SendTimeTextStyled = styled(Text)`
  letter-spacing: ${chatFonts.tertiary.letterSpacing};
  font-family: ${chatFonts.tertiary.fontFamily};
`;
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
        <SenderNameTextStyled
          color={chatFonts.primary.color}
          size={chatFonts.primary.fontSize}
          title={intl.formatMessage(messages.senderTitle)}
          truncate={true}
          weight={chatFonts.primary.fontWeight}
        >
          {msgSender}
        </SenderNameTextStyled>
      </Box>
      <Box
        direction="row-reverse"
        margin={{
          left: '5px',
        }}
        width="100%"
      >
        <SendTimeTextStyled
          color={chatFonts.tertiary.color}
          size={chatFonts.tertiary.fontSize}
          title={intl.formatMessage(messages.messageTimeTitle)}
        >
          {msgDatetime.toFormat('(HH:mm)')}
        </SendTimeTextStyled>
      </Box>
    </Box>
  );
};
