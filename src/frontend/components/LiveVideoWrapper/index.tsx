import React from 'react';

import { Video } from 'types/tracks';
import { useVideo } from 'data/stores/useVideo';
import { LiveVideoInformationBar } from 'components/LiveVideoInformationBar';
import { Chat } from 'components/Chat';
import DashboardVideoLiveJitsi from 'components/DashboardVideoLiveJitsi';
import VideoPlayer from 'components/VideoPlayer';
import { LiveStudentLayout } from 'components/LiveStudentLayout';

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
  const video = useVideo((state) => state.getVideo(baseVideo));
  const isPanelOpen = false;

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
      isPanelOpen={isPanelOpen}
      bottomElement={<LiveVideoInformationBar video={video} />}
    />
  );
};
