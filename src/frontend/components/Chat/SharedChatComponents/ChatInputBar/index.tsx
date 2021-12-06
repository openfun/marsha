import { SendButtonSVG } from 'components/SVGIcons/SendButtonSVG';
import { Box, Button, TextInput } from 'grommet';
import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';
import { converse } from '../../../../utils/window';

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
  border-color: #035ccd;
  border-radius: 6px;
  margin: 5px;
`;

const TextInputStyled = styled(TextInput)`
  font-weight: normal;
  color: #035ccd;
`;

export const ChatInputBar = () => {
  const [chatMessage, setChatMessage] = useState('');
  const intl = useIntl();

  const handleSendMessage = async () => {
    if (chatMessage.length !== 0) {
      await converse.sendMessageWithConverse(chatMessage);
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
      direction={'row'}
      align={'center'}
      border={{
        size: '1px',
        color: '#035ccd',
      }}
      round={'6px'}
      margin={'10px'}
      height={'50px'}
    >
      <TextInputStyled
        placeholder={intl.formatMessage(messages.inputBarPlaceholder)}
        value={chatMessage}
        onChange={(event) => setChatMessage(event.target.value)}
        plain={true}
        focusIndicator={false}
        onKeyPress={(keyPressEvent) => handleKeypress(keyPressEvent)}
        size={'16px'}
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
              iconColor={'#035ccd'}
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
