import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { theme } from 'lib-common';

const messages = defineMessages({
  avatarTitle: {
    defaultMessage: "The user's avatar",
    description: 'A title describing the avatar icon purpose.',
    id: 'component.ChatAvatar.avatarTitle',
  },
});

interface AvatarProps {
  isInstructor: boolean;
}

const AvatarBox = styled(Box)`
  outline: ${({ isInstructor }: AvatarProps) =>
    isInstructor && `2px solid ${normalizeColor('blue-active', theme)}`};
`;

interface ChatAvatarProps {
  isInstructor?: boolean;
}

export const ChatAvatar = ({ isInstructor }: ChatAvatarProps) => {
  const intl = useIntl();
  return (
    <AvatarBox
      background={`${normalizeColor('blue-active', theme)}19`}
      isInstructor={isInstructor!}
      height="26px"
      round="6px"
      title={intl.formatMessage(messages.avatarTitle)}
      width="26px"
    />
  );
};
