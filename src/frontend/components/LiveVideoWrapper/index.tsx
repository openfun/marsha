import React, { useEffect } from 'react';

import { Chat } from 'components/Chat';
import DashboardVideoLiveJitsi from 'components/DashboardVideoLiveJitsi';
import { LiveVideoInformationBar } from 'components/LiveVideoInformationBar';
import { LiveStudentLayout } from 'components/LiveStudentLayout';
import VideoPlayer from 'components/VideoPlayer';
import {
  LivePanelDetail,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';

interface LiveStreamerConfiguration {
  type: 'on_stage';
}

interface LiveViewerConfiguration {
  type: 'viewer';
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
  const { isPanelVisible, setPanelVisibility, configPanel } = useLivePanelState(
    (state) => ({
      isPanelVisible: state.isPanelVisible,
      setPanelVisibility: state.setPanelVisibility,
      configPanel: state.setAvailableDetails,
    }),
  );
  const video = useVideo((state) => state.getVideo(baseVideo));

  useEffect(() => {
    setPanelVisibility(false);

    //  configure panel to display the chat only when available
    if (video.xmpp) {
      configPanel([LivePanelDetail.CHAT], LivePanelDetail.CHAT);
    } else {
      configPanel([], undefined);
    }
  }, [setPanelVisibility, configPanel, video.xmpp]);

  return (
    <LiveStudentLayout
      mainElement={
        <React.Fragment>
          {configuration.type === 'on_stage' && (
            <DashboardVideoLiveJitsi video={video} />
          )}
          {configuration.type === 'viewer' && (
            <VideoPlayer
              video={video}
              playerType={configuration.playerType}
              timedTextTracks={[]}
            />
          )}
        </React.Fragment>
      }
      sideElement={video.xmpp ? <Chat video={video} /> : undefined}
      isPanelOpen={isPanelVisible}
      bottomElement={<LiveVideoInformationBar video={video} />}
    />
  );
};
