import React, { useEffect } from 'react';

import DashboardVideoLiveJitsi from 'components/DashboardVideoLiveJitsi';
import { LiveVideoPanel } from 'components/LiveVideoPanel';
import { StudentLiveControlBar } from 'components/StudentLiveControlBar';
import { StudentLiveInfoBar } from 'components/StudentLiveInfoBar';
import VideoPlayer from 'components/VideoPlayer';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';

import { StudentLiveLayout } from './StudentLiveLayout';

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

  useEffect(() => {
    const availableItems: LivePanelItem[] = [];
    let currentItem;
    if (video.xmpp !== null) {
      availableItems.push(LivePanelItem.CHAT);
      //  if available, LivePanelItem.CHAT needs to be selected by default
      //  because it will be rendered hidden and connection to XMPP will be initialized
      currentItem = LivePanelItem.CHAT;
    }
    configPanel(availableItems, currentItem);
  }, [video, configPanel]);

  return (
    <StudentLiveLayout
      actionsElement={<StudentLiveControlBar video={video} />}
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
            <VideoPlayer
              video={video}
              playerType={configuration.playerType}
              timedTextTracks={[]}
            />
          )}
        </React.Fragment>
      }
      sideElement={<LiveVideoPanel video={video} />}
    />
  );
};
