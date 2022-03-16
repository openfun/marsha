import React, { useEffect } from 'react';

import { ConverseInitializer } from 'components/ConverseInitializer';
import DashboardVideoLiveJitsi from 'components/DashboardVideoLiveJitsi';
import { LiveVideoLayout } from 'components/LiveVideoLayout';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { StudentLiveControlBar } from 'components/StudentLiveControlBar';
import { StudentLiveInfoBar } from 'components/StudentLiveInfoBar';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';

import { StudentLiveViewerWrapper } from './StudentLiveViewerWrapper';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';

interface LiveVideoWrapperProps {
  video: Video;
  playerType: string;
}

export const LiveVideoWrapper: React.FC<LiveVideoWrapperProps> = ({
  video: baseVideo,
  playerType,
}) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const { isPanelVisible, configPanel, setPanelVisibility } = useLivePanelState(
    (state) => ({
      isPanelVisible: state.isPanelVisible,
      configPanel: state.setAvailableItems,
      setPanelVisibility: state.setPanelVisibility,
    }),
  );
  const { isStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
  }));
  const isParticipantOnstage = useParticipantWorkflow(
    (state) => state.accepted,
  );

  useEffect(() => {
    const availableItems: LivePanelItem[] = [];
    let currentItem;
    if (video.xmpp !== null) {
      availableItems.push(LivePanelItem.CHAT);
      availableItems.push(LivePanelItem.VIEWERS_LIST);
      currentItem = LivePanelItem.CHAT;
      if (isStarted) {
        setPanelVisibility(true);
      }
    }
    configPanel(availableItems, currentItem);
  }, [video, configPanel, isStarted]);

  return (
    <ConverseInitializer video={video}>
      <LiveVideoLayout
        actionsElement={<StudentLiveControlBar video={video} />}
        displayActionsElement={isParticipantOnstage || isStarted}
        isPanelOpen={isPanelVisible}
        liveTitleElement={
          <StudentLiveInfoBar title={video.title} startDate={null} />
        }
        mainElement={
          isParticipantOnstage ? (
            <DashboardVideoLiveJitsi video={video} />
          ) : (
            <StudentLiveViewerWrapper video={video} playerType={playerType} />
          )
        }
        sideElement={<LiveVideoPanel video={video} />}
      />
    </ConverseInitializer>
  );
};
