import { Box, Button, Text } from 'grommet';
import { FormTrash } from 'grommet-icons';
import React, { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ChatMessageType } from 'data/stores/useChatItemsStore';
import { theme } from 'utils/theme/theme';
import { converse } from 'utils/window';
import { Nullable } from '../../../../utils/types';

const messages = defineMessages({
  sentAt: {
    defaultMessage: 'sent at {sentAt}',
    description: "'Sent at' text for message's datetime display.",
    id: 'component.ChatMessage.sentAt',
  },
});

const { chatFonts } = theme.chat;
const MessageContentTextStyled = styled(Text)`
  line-height: ${chatFonts.secondary.lineHeight};
  letter-spacing: ${chatFonts.secondary.letterSpacing};
  font-family: ${chatFonts.secondary.fontFamily};
`;

const StyledFormTrash = styled(FormTrash)`
  :hover {
    transform: scale(1.2, 1.2);
  }
  :active {
    animation: none;
  }
`;

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [moderated, setModerated] = useState<Nullable<string>>(null);
  const intl = useIntl();

  const memo = useMemo(
    () => (
      <Box
        direction="row"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        fill
        style={{ position: 'relative' }}
      >
        <Box
          background="bg-marsha"
          pad="5px"
          round="6px"
          title={intl.formatMessage(messages.sentAt, {
            sentAt: message.sentAt.toFormat('HH:mm:ss'),
          })}
          margin={{ horizontal: '20px' }}
          fill
        >
          <MessageContentTextStyled
            color={chatFonts.secondary.color}
            size={chatFonts.secondary.fontSize}
            wordBreak="break-word"
          >
            {!moderated ? message.content : moderated}
          </MessageContentTextStyled>
        </Box>
        {isHovered && (
          <Button
            icon={
              <StyledFormTrash
                color="bg-lightgrey"
                size="medium"
                style={{ position: 'absolute', right: '-2px' }}
              />
            }
            onClick={() => {
              converse.sendRetractionIQ(
                message.id,
                'This message has been moderated.',
              );
              setModerated('This message has been moderated.');
            }}
            plain
          />
        )}
      </Box>
    ),
    [message, isHovered],
  );
  return memo;
};
