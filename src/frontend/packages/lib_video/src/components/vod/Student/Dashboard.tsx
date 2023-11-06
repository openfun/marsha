import { colorsTokens } from 'lib-common';
import { Box, Video, liveState, useTimedTextTrack } from 'lib-components';
import React from 'react';

import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';
import { VideoWebSocketInitializer } from '@lib-video/components/common/VideoWebSocketInitializer';
import { VideoWidgetProvider } from '@lib-video/components/common/VideoWidgetProvider';
import { MissingVideoUrlsException } from '@lib-video/errors';
import { CurrentVideoProvider } from '@lib-video/hooks/useCurrentVideo';

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
        <Box background={colorsTokens['primary-100']}>
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
