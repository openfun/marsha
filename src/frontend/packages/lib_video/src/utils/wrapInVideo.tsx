import { Video } from 'lib-components';
import React, { ReactNode } from 'react';

import {
  CurrentLiveProvider,
  CurrentVideoProvider,
} from '@lib-video/hooks/useCurrentVideo';

import { convertVideoToLive } from './convertVideo';

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
