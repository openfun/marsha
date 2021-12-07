import { Box, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

import { theme } from 'utils/theme/theme';

interface ChatMessageContentProps {
  messageContent: string;
}

const { chatFonts } = theme.chat;
const MessageContentTextStyled = styled(Text)`
  letter-spacing: ${chatFonts.secondary.letterSpacing};
  line-height: ${chatFonts.secondary.lineHeight};
`;

export const ChatMessageContent = ({
  messageContent,
}: ChatMessageContentProps) => {
  return (
    <Box
      background="#edf5fa"
      margin={{
        left: '32px',
      }}
      pad="5px"
      round="6px"
    >
      <MessageContentTextStyled
        color={chatFonts.secondary.color}
        size={chatFonts.secondary.fontSize}
        wordBreak="break-word"
      >
        {messageContent}
      </MessageContentTextStyled>
    </Box>
  );
};
