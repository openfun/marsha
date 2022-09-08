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
  disabled?: boolean;
  handleClick: () => void;
}

export const JoinChatButton = ({
  disabled,
  handleClick,
}: JoinChatButtonProps) => {
  const intl = useIntl();

  return (
    <Box
      border={{
        color: 'blue-chat',
        size: 'xsmall',
      }}
      height="50px"
      round="6px"
    >
      <Button disabled={disabled} fill onClick={handleClick}>
        <Box align="center" fill justify="center">
          <Text color="blue-chat" size="1.063rem" truncate>
            {intl.formatMessage(messages.joinChatButton)}
          </Text>
        </Box>
      </Button>
    </Box>
  );
};
