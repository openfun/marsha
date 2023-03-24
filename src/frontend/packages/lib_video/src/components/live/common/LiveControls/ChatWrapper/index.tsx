import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { StudentHideChatButton } from './StudentHideChatButton';
import { StudentShowChatButton } from './StudentShowChatButton';

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
