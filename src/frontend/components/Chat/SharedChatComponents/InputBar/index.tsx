import { Box, Button, Spinner, Text, TextInput } from 'grommet';
import React, { useState } from 'react';
import styled from 'styled-components';

import { SendButtonSVG } from 'components/SVGIcons/SendButtonSVG';

const ButtonStyled = styled(Button)`
  padding: 0;
`;

const StyledMiniSpinner = styled(Spinner)`
  height: 15px;
  margin: auto;
  padding: 0px;
  width: 15px;
`;

interface InputBarProps {
  handleUserInput: (inputText: string) => boolean;
  isChatInput: boolean;
  isDisabled?: boolean;
  isWaiting?: boolean;
  placeholderText: string;
}

export const InputBar = ({
  handleUserInput,
  isChatInput,
  isDisabled,
  isWaiting,
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

  const desactivateForm = isDisabled || isWaiting;

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
        disabled={desactivateForm}
        focusIndicator={false}
        onChange={(event) => setInputText(event.target.value)}
        onKeyPress={handleKeypress}
        placeholder={
          <Box style={{ display: 'inline-grid' }} width="100%">
            <Text
              color={'blue-chat'}
              size={isChatInput ? '16px' : '12px'}
              style={desactivateForm ? { opacity: 0.3 } : undefined}
              truncate
            >
              {placeholderText}
            </Text>
          </Box>
        }
        plain
        size={isChatInput ? '16px' : '13px'}
        style={{
          fontFamily: 'Roboto-Regular',
          fontWeight: isChatInput ? 'normal' : 'bold',
        }}
        value={inputText}
      />

      <ButtonStyled
        disabled={desactivateForm}
        icon={
          <Box
            align="center"
            alignContent="center"
            justify="center"
            border={{
              color: 'blue-chat',
              size: 'xsmall',
            }}
            height={isChatInput ? '40px' : '25px'}
            round="6px"
            style={{
              minWidth: isChatInput ? '40px' : '25px',
            }}
            width={isChatInput ? '40px' : '25px'}
          >
            {!isWaiting ? (
              <SendButtonSVG
                containerStyle={{
                  height: isChatInput ? '21px' : '11px',
                  width: isChatInput ? '21px' : '15px',
                }}
                iconColor="blue-chat"
              />
            ) : isChatInput ? (
              <Spinner />
            ) : (
              <StyledMiniSpinner />
            )}
          </Box>
        }
        onClick={handleOnClick}
        plain
      />
    </Box>
  );
};
