import React from 'react';

import { StudentHideAppsButton } from 'components/StudentLiveControlButtons/StudentHideAppsButton';
import { StudentShowAppsButton } from 'components/StudentLiveControlButtons/StudentShowAppsButton';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

export const AppsWrapper = () => {
  const { currentItem, isPanelVisible } = useLivePanelState((state) => ({
    currentItem: state.currentItem,
    isPanelVisible: state.isPanelVisible,
  }));

  if (currentItem === LivePanelItem.APPLICATION && isPanelVisible) {
    return <StudentHideAppsButton />;
  } else {
    return <StudentShowAppsButton />;
  }
};
