import React from 'react';

import { StudentHideChatButton } from 'components/StudentLiveControlButtons/StudentHideChatButton';
import { StudentShowChatButton } from 'components/StudentLiveControlButtons/StudentShowChatButton';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

export const ChatWrapper = () => {
  const { currentItem, isPanelVisible } = useLivePanelState((state) => ({
    currentItem: state.currentItem,
    isPanelVisible: state.isPanelVisible,
  }));

  if (currentItem === LivePanelItem.CHAT && isPanelVisible) {
    return <StudentHideChatButton />;
  } else {
    return <StudentShowChatButton />;
  }
};
