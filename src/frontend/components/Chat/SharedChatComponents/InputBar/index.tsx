import { Box, Button, Text, TextInput } from 'grommet';
import React, { useState } from 'react';
import styled from 'styled-components';

import { SendButtonSVG } from 'components/SVGIcons/SendButtonSVG';

const ButtonStyled = styled(Button)`
  padding: 0;
`;

interface InputBarProps {
  handleUserInput: (inputText: string) => boolean;
  isChatInput: boolean;
  placeholderText: string;
}

export const InputBar = ({
  handleUserInput,
  isChatInput,
  placeholderText,
}: InputBarProps) => {
  const [inputText, setInputText] = useState('');

  const handleOnClick = () => {
    if (inputText.length !== 0) {
      if (handleUserInput(inputText)) {
        setInputText('');
      }
    }
  };

  const handleKeypress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === 'Enter') {
      handleOnClick();
    }
  };

  return (
    <Box
      align="center"
      border={{
        color: 'blue-chat',
        size: 'xsmall',
      }}
      direction="row"
      height={isChatInput ? '50px' : '35px'}
      pad={{
        right: isChatInput ? '5px' : '3px',
      }}
      round="6px"
    >
      <TextInput
        focusIndicator={false}
        onChange={(event) => setInputText(event.target.value)}
        onKeyPress={handleKeypress}
        placeholder={
          <Box style={{ display: 'inline-grid' }} width="100%">
            <Text
              color="blue-chat"
              size={isChatInput ? '16px' : '12px'}
              truncate
            >
              {placeholderText}
            </Text>
          </Box>
        }
        plain
        size={isChatInput ? '16px' : '13px'}
        style={{
          fontWeight: isChatInput ? 'normal' : 'bold',
          fontFamily: 'Roboto-Regular',
        }}
        value={inputText}
      />
      <Box
        border={{
          size: 'xsmall',
          color: 'blue-chat',
        }}
        height={isChatInput ? '40px' : '25px'}
        round="6px"
        style={{
          minWidth: isChatInput ? '40px' : '25px',
        }}
        width={isChatInput ? '40px' : '25px'}
      >
        <ButtonStyled
          fill
          icon={
            <Box align="center" alignContent="center" justify="center">
              <SendButtonSVG
                containerStyle={{
                  height: isChatInput ? '21px' : '11px',
                  width: isChatInput ? '21px' : '15px',
                }}
                iconColor="blue-chat"
              />
            </Box>
          }
          onClick={handleOnClick}
          plain
        />
      </Box>
    </Box>
  );
};
