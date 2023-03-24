import React from 'react';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { StudentHideViewersButton } from './StudentHideViewersButton';
import { StudentShowViewersButton } from './StudentShowViewersButton';

export const ViewersWrapper = () => {
  const video = useCurrentVideo();
  const { currentItem, isPanelVisible } = useLivePanelState((state) => ({
    currentItem: state.currentItem,
    isPanelVisible: state.isPanelVisible,
  }));

  const nbrOfOnStageRequests =
    video && video.participants_asking_to_join.length;

  if (currentItem === LivePanelItem.VIEWERS_LIST && isPanelVisible) {
    return (
      <StudentHideViewersButton nbrOfOnStageRequests={nbrOfOnStageRequests} />
    );
  } else {
    return (
      <StudentShowViewersButton nbrOfOnStageRequests={nbrOfOnStageRequests} />
    );
  }
};
