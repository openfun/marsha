import { Box, Button, Text, TextInput } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { SendButtonSVG } from 'components/SVGIcons/SendButtonSVG';
import { converse } from 'utils/window';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  inputBarPlaceholder: {
    defaultMessage: 'Message...',
    description:
      'The input bar to write, edit and send messages to the chat conversation.',
    id: 'components.InputBar.inputBarPlaceholder',
  },
});

const SendButtonStyled = styled(Button)`
  width: 40px;
  height: 40px;
  border: 1px solid;
  border-color: ${normalizeColor('blue-chat', theme)};
  border-radius: 6px;
  margin: 5px;
`;

export const ChatInputBar = () => {
  const [chatMessage, setChatMessage] = useState('');
  const intl = useIntl();

  const handleSendMessage = async () => {
    if (chatMessage.length !== 0) {
      await converse.sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleKeypress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Box
      direction="row"
      align="center"
      border={{
        size: 'xsmall',
        color: 'blue-chat',
      }}
      round="xsmall"
      margin="10px"
      height="50px"
    >
      <TextInput
        placeholder={
          <Text color="blue-chat" size="16px">
            {intl.formatMessage(messages.inputBarPlaceholder)}
          </Text>
        }
        value={chatMessage}
        onChange={(event) => setChatMessage(event.target.value)}
        plain={true}
        focusIndicator={false}
        onKeyPress={(keyPressEvent) => handleKeypress(keyPressEvent)}
        size="16px"
      />
      <SendButtonStyled
        onClick={() => handleSendMessage()}
        icon={
          <Box
            margin={{
              vertical: '2px',
              horizontal: '-7px',
            }}
          >
            <SendButtonSVG
              iconColor={'blue-chat'}
              containerStyle={{
                width: '25px',
                height: '22px',
              }}
            />
          </Box>
        }
      />
    </Box>
  );
};
