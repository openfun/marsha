import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

import { StudentHideAppsButton } from './StudentHideAppsButton';
import { StudentShowAppsButton } from './StudentShowAppsButton';

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
