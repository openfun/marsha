import { colorsTokens } from 'lib-common';
import { Box } from 'lib-components';
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

interface AvatarProps {
  $isInstructor: boolean;
}

const AvatarBox = styled(Box)`
  outline: ${({ $isInstructor }: AvatarProps) =>
    $isInstructor && `2px solid ${colorsTokens['info-500']}`};
`;

interface ChatAvatarProps {
  isInstructor?: boolean;
}

export const ChatAvatar = ({ isInstructor = false }: ChatAvatarProps) => {
  const intl = useIntl();
  return (
    <AvatarBox
      background={`${colorsTokens['info-500']}19`}
      $isInstructor={isInstructor}
      height="26px"
      round="6px"
      title={intl.formatMessage(messages.avatarTitle)}
      width="26px"
    />
  );
};
