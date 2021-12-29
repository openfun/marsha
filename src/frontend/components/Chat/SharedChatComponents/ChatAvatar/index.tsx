import { Box } from 'grommet';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

const messages = defineMessages({
  avatarTitle: {
    defaultMessage: "The user's avatar",
    description: 'A title describing the avatar icon purpose.',
    id: 'component.ChatAvatar.avatarTitle',
  },
});

const AvatarBox = styled(Box)`
  // minWidth is set otherwise avatar width is crushed by the margin of the component next to the avatar
  min-width: 24px;
`;

interface ChatAvatarProps {
  isInstructor?: boolean;
}

export const ChatAvatar = ({ isInstructor }: ChatAvatarProps) => {
  const intl = useIntl();
  return (
    <AvatarBox
      background="#edf5fa"
      border={
        isInstructor
          ? {
              color: 'blue-chat',
              size: 'small',
            }
          : undefined
      }
      height="24px"
      round="6px"
      title={intl.formatMessage(messages.avatarTitle)}
      width="24px"
    />
  );
};
