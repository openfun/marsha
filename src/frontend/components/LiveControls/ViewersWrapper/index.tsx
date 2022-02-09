import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

import { StudentHideViewersButton } from './StudentHideViewersButton';
import { StudentShowViewersButton } from './StudentShowViewersButton';

export const ViewersWrapper = () => {
  const { currentItem, isPanelVisible } = useLivePanelState((state) => ({
    currentItem: state.currentItem,
    isPanelVisible: state.isPanelVisible,
  }));

  if (currentItem === LivePanelItem.VIEWERS_LIST && isPanelVisible) {
    return <StudentHideViewersButton />;
  } else {
    return <StudentShowViewersButton />;
  }
};
