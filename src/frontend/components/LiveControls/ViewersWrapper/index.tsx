import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { Video } from 'types/tracks';
import { StudentHideViewersButton } from './StudentHideViewersButton';
import { StudentShowViewersButton } from './StudentShowViewersButton';

interface ViewersWrapperProps {
  video?: Video;
}

export const ViewersWrapper = ({ video }: ViewersWrapperProps) => {
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
