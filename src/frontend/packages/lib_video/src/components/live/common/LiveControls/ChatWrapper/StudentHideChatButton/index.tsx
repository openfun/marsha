import { Button, ChatSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useLivePanelState } from '@lib-video/hooks/useLivePanelState';

const messages = defineMessages({
  chat: {
    defaultMessage: 'Chat',
    description: 'Label for the chat button',
    id: 'components.StudentHideChatButton.Chat',
  },
  hideChat: {
    defaultMessage: 'Hide chat',
    description: 'Title for the chat button',
    id: 'components.StudentHideChatButton.hideChat',
  },
});

export const StudentHideChatButton = () => {
  const intl = useIntl();
  const { setPanelVisibility } = useLivePanelState((state) => ({
    setPanelVisibility: state.setPanelVisibility,
  }));

  return (
    <Button
      label={intl.formatMessage(messages.chat)}
      Icon={ChatSVG}
      onClick={() => {
        setPanelVisibility(false);
      }}
      reversed
      title={intl.formatMessage(messages.hideChat)}
    />
  );
};
