import React, { useEffect, useState } from 'react';

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
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';
import { StudentLiveViewerWrapper } from './StudentLiveViewerWrapper';

interface LiveVideoWrapperProps {
  video: Video;
  playerType: string;
}

export const LiveVideoWrapper: React.FC<LiveVideoWrapperProps> = ({
  video: baseVideo,
  playerType,
}) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const { isPanelVisible, configPanel, currentItem, setPanelVisibility } =
    useLivePanelState((state) => ({
      isPanelVisible: state.isPanelVisible,
      configPanel: state.setAvailableItems,
      currentItem: state.currentItem,
      setPanelVisibility: state.setPanelVisibility,
    }));
  const { isStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
  }));
  const isParticipantOnstage = useParticipantWorkflow(
    (state) => state.accepted,
  );
  const [showPanelTrigger, setShowPanelTrigger] = useState(true);

  useEffect(() => {
    // if the xmpp object is not null, panel state is filled
    if (video.xmpp !== null) {
      configPanel(
        [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
        // if the panel has a previous selected tab, it is this one which is used
        currentItem ? currentItem : LivePanelItem.CHAT,
      );
    }
    // if the xmpp object becomes unavailable, panel is uninitialized (but selected tab stays unchanged)
    else {
      configPanel([]);
    }
  }, [video.xmpp]);

  // show panel only when user first time comes on the live
  useEffect(() => {
    if (video.xmpp && isStarted && currentItem && showPanelTrigger) {
      setPanelVisibility(true);
      setShowPanelTrigger(false);
    }
  }, [video.xmpp, isStarted, currentItem, showPanelTrigger]);

  return (
    <ConverseInitializer video={video}>
      <LiveVideoLayout
        actionsElement={<StudentLiveControlBar video={video} />}
        displayActionsElement={!!video.xmpp}
        isPanelOpen={isPanelVisible}
        isXmppReady={!!video.xmpp}
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
