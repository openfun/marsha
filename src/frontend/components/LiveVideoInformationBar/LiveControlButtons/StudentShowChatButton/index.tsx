import React from 'react';
import { Button } from 'grommet';
import { defineMessages, useIntl } from 'react-intl';

import { ChatSVG } from 'components/SVGIcons/ChatSVG';
import {
  LivePanelDetail,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

const messages = defineMessages({
  ShowChatTitleButton: {
    defaultMessage: 'Show/Hide Chat',
    description: 'Title for the show/hide chat button',
    id: 'components.StudentShowChatButton.ShowChatTitleButton',
  },
});

export const StudentShowChatButton = () => {
  const intl = useIntl();
  const { openOrCloseChat, isPanelVisible, isChatSelected } = useLivePanelState(
    (state) => ({
      openOrCloseChat: state.setPanelVisibility,
      isPanelVisible: state.isPanelVisible,
      isChatSelected: state.currentDetail === LivePanelDetail.CHAT,
    }),
  );
  //  chat is consider open when the pane is open and the pane is displaying the chat
  const isChatOpen = isPanelVisible && isChatSelected;

  return (
    <Button
      margin={{ right: 'medium', left: 'medium' }}
      a11yTitle={intl.formatMessage(messages.ShowChatTitleButton)}
      onClick={() => openOrCloseChat(!isChatOpen, LivePanelDetail.CHAT)}
      style={{ padding: '0' }}
      icon={
        <ChatSVG
          baseColor={isChatOpen ? 'blue-active' : 'blue-off'}
          hoverColor={'blue-active'}
          title={intl.formatMessage(messages.ShowChatTitleButton)}
          width={'35.42'}
          height={'35.42'}
        />
      }
    />
  );
};
