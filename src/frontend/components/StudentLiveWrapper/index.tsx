import React, { useEffect } from 'react';

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

export enum LiveType {
  ON_STAGE = 'on_stage',
  VIEWER = 'viewer',
}

interface LiveStreamerConfiguration {
  type: LiveType.ON_STAGE;
}

interface LiveViewerConfiguration {
  type: LiveType.VIEWER;
  playerType: string;
}

interface LiveVideoWrapperProps {
  video: Video;
  configuration: LiveStreamerConfiguration | LiveViewerConfiguration;
}

export const LiveVideoWrapper: React.FC<LiveVideoWrapperProps> = ({
  video: baseVideo,
  configuration,
}) => {
  const video = useVideo((state) => state.getVideo(baseVideo));
  const { isPanelVisible, configPanel } = useLivePanelState((state) => ({
    isPanelVisible: state.isPanelVisible,
    configPanel: state.setAvailableItems,
  }));
  const { isStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
  }));

  useEffect(() => {
    const availableItems: LivePanelItem[] = [];
    let currentItem;
    if (video.xmpp !== null) {
      availableItems.push(LivePanelItem.CHAT);
      availableItems.push(LivePanelItem.VIEWERS_LIST);
      currentItem = LivePanelItem.CHAT;
      if (isStarted) {
        useLivePanelState.getState().setPanelVisibility(true);
      }
    }
    configPanel(availableItems, currentItem);
  }, [video, configPanel, isStarted]);

  return (
    <LiveVideoLayout
      actionsElement={<StudentLiveControlBar video={video} />}
      displayActionsElement={
        configuration.type === LiveType.ON_STAGE || isStarted
      }
      isPanelOpen={isPanelVisible}
      liveTitleElement={
        <StudentLiveInfoBar title={video.title} startDate={null} />
      }
      mainElement={
        <React.Fragment>
          {configuration.type === LiveType.ON_STAGE && (
            <DashboardVideoLiveJitsi video={video} />
          )}
          {configuration.type === LiveType.VIEWER && (
            <StudentLiveViewerWrapper
              video={video}
              playerType={configuration.playerType}
            />
          )}
        </React.Fragment>
      }
      sideElement={<LiveVideoPanel video={video} />}
    />
  );
};
