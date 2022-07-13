import React from 'react';

import {
  CurrentLiveProvider,
  CurrentVideoProvider,
} from 'data/stores/useCurrentRessource/useCurrentVideo';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';
import { convertVideoToLive } from 'utils/conversions/convertVideo';

import { PublicLiveDashboard } from './PublicLiveDashboard';
import { PublicVODDashboard } from './PublicVODDashboard';

interface PublicVideoDashboardProps {
  video: Video;
  playerType: string;
}

const PublicVideoDashboard = ({
  video: baseVideo,
  playerType,
}: PublicVideoDashboardProps) => {
  const video = useVideo((state) => state.getVideo(baseVideo));

  const live = convertVideoToLive(video);
  if (live) {
    return (
      <CurrentVideoProvider value={live}>
        <CurrentLiveProvider value={live}>
          <PublicLiveDashboard playerType={playerType} />
        </CurrentLiveProvider>
      </CurrentVideoProvider>
    );
  }

  return (
    <CurrentVideoProvider value={video}>
      <PublicVODDashboard playerType={playerType} />
    </CurrentVideoProvider>
  );
};

export default PublicVideoDashboard;
