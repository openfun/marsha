import { Box, Button, Text } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  joinChatButton: {
    defaultMessage: 'Join the chat',
    description: "Button's label offering the user to join the chat.",
    id: 'components.InputBar.joinChatButton',
  },
});

interface JoinChatButtonProps {
  handleClick: () => void;
}

export const JoinChatButton = ({ handleClick }: JoinChatButtonProps) => {
  const intl = useIntl();

  return (
    <Box
      align="center"
      border={{
        color: 'blue-chat',
        size: 'xsmall',
      }}
      height="50px"
      round="6px"
    >
      <Button fill onClick={handleClick} plain>
        <Box>
          <Text
            color="blue-chat"
            size="1.063rem"
            style={{ fontFamily: 'Roboto-Regular' }}
            textAlign="center"
            truncate
          >
            {intl.formatMessage(messages.joinChatButton)}
          </Text>
        </Box>
      </Button>
    </Box>
  );
};
