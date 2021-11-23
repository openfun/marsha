import React from 'react';
import { Button } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';

import { ChatSVG } from 'components/SVGIcons/ChatSVG';

const messages = defineMessages({
  ShowChatTitleButton: {
    defaultMessage: 'Show/Hide Chat',
    description: 'Title for the show/hide chat button',
    id: 'components.StudentShowChatButton.ShowChatTitleButton',
  },
});

export const StudentShowChatButton = () => {
  const intl = useIntl();

  return (
    <Button
      margin={{ right: 'medium', left: 'medium' }}
      a11yTitle={intl.formatMessage(messages.ShowChatTitleButton)}
      style={{ padding: '0' }}
      icon={
        <ChatSVG
          baseColor={'blue-off'}
          hoverColor={'blue-active'}
          title={intl.formatMessage(messages.ShowChatTitleButton)}
          width={'35.42'}
          height={'35.42'}
        />
      }
    />
  );
};
