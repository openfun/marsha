import { Box } from 'grommet';
import { liveState, useTimedTextTrack, Video } from 'lib-components';
import React from 'react';

import { VideoPlayer } from 'components/common/VideoPlayer';
import { VideoWebSocketInitializer } from 'components/common/VideoWebSocketInitializer';
import { VideoWidgetProvider } from 'components/common/VideoWidgetProvider';
import { MissingVideoUrlsException } from 'errors';
import { CurrentVideoProvider } from 'hooks/useCurrentVideo';

import { VideoFromLiveDashboard } from './VideoFromLiveDashboard';

interface DashbobardProps {
  video: Video;
  socketUrl: string;
  playerType: string;
}

export const Dashboard = ({
  video,
  socketUrl,
  playerType,
}: DashbobardProps) => {
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  if (!video.urls) {
    throw new MissingVideoUrlsException('VOD has no urls.');
  }

  return (
    <CurrentVideoProvider value={video}>
      <VideoWebSocketInitializer url={socketUrl} videoId={video.id}>
        <Box background={{ color: 'bg-marsha' }}>
          <Box>
            {video.live_state === liveState.ENDED ? (
              <VideoFromLiveDashboard
                video={video}
                socketUrl={socketUrl}
                playerType={playerType}
                timedTextTracks={timedTextTracks}
              />
            ) : (
              <VideoPlayer
                video={video}
                playerType={playerType}
                timedTextTracks={timedTextTracks}
              />
            )}
          </Box>

          <VideoWidgetProvider isLive={false} isTeacher={false} />
        </Box>
      </VideoWebSocketInitializer>
    </CurrentVideoProvider>
  );
};
