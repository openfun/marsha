import React from 'react';

import { StudentHideViewersButton } from 'components/StudentLiveControlButtons/StudentHideViewersButton';
import { StudentShowViewersButton } from 'components/StudentLiveControlButtons/StudentShowViewersButton';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

export const ViewersWrapper = () => {
  const { currentItem, isPanelVisible } = useLivePanelState((state) => ({
    currentItem: state.currentItem,
    isPanelVisible: state.isPanelVisible,
  }));

  if (currentItem === LivePanelItem.JOIN_DISCUSSION && isPanelVisible) {
    return <StudentHideViewersButton />;
  } else {
    return <StudentShowViewersButton />;
  }
};
