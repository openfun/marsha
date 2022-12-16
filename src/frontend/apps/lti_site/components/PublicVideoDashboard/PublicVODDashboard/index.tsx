import { Box } from 'grommet';
import React from 'react';
import { Redirect } from 'react-router-dom';

import {
  FULL_SCREEN_ERROR_ROUTE,
  useTimedTextTrack,
  uploadState,
  liveState,
} from 'lib-components';
import VideoPlayer from 'components/VideoPlayer';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { VideoWidgetProvider } from 'components/VideoWidgetProvider';
import { LiveToVODDashboard } from '../LiveToVODDashboard';

interface PublicVODDashboardProps {
  playerType: string;
}

export const PublicVODDashboard = ({ playerType }: PublicVODDashboardProps) => {
  const video = useCurrentVideo();
  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  if (video.upload_state === uploadState.DELETED) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('videoDeleted')} />;
  }

  if (!video.urls) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE()} />;
  }

  return (
    <Box background={{ color: 'bg-marsha' }}>
      <Box>
        {video.live_state === liveState.ENDED ? (
          <LiveToVODDashboard
            video={video}
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
  );
};
