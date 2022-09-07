import React, { ReactNode } from 'react';

import {
  CurrentLiveProvider,
  CurrentVideoProvider,
} from 'data/stores/useCurrentRessource/useCurrentVideo';
import { Video } from 'types/tracks';
import { convertVideoToLive } from 'utils/conversions/convertVideo';

export const wrapInVideo = (component: ReactNode, video: Video) => {
  const live = convertVideoToLive(video);
  if (live) {
    return (
      <CurrentVideoProvider value={video}>
        <CurrentLiveProvider value={live}>{component}</CurrentLiveProvider>
      </CurrentVideoProvider>
    );
  }

  return <CurrentVideoProvider value={video}>{component}</CurrentVideoProvider>;
};
