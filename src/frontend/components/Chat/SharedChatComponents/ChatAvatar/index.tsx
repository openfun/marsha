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
  background-color: #edf5fa;
  border-radius: 6px;
  height: 24px;
  // minWidth is set otherwise avatar width is crushed by the margin of the component next to the avata
  min-width: 24px;
  width: 24px;
`;

export const ChatAvatar = () => {
  const intl = useIntl();
  return <AvatarBox title={intl.formatMessage(messages.avatarTitle)} />;
};
