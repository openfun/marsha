import React from 'react';

import { DashboardLive } from 'components/DashboardLive';
import { DashboardVOD } from 'components/DashboardVOD';
import { CurrentVideoProvider } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { JitsiApiProvider } from 'data/stores/useJitsiApi';
import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';
import { PictureInPictureProvider } from 'data/stores/usePictureInPicture';
import { useVideo, liveState, uploadState, Video } from 'lib-components';
import { initVideoWebsocket } from 'data/websocket';

interface DashboardVideoWrapperProps {
  video: Video;
}

export const DashboardVideoWrapper = ({
  video,
}: DashboardVideoWrapperProps) => {
  const currentVideo = useVideo((state) => state.getVideo(video));
  initVideoWebsocket(currentVideo);

  if (
    ![null, liveState.ENDED].includes(currentVideo.live_state) &&
    currentVideo.upload_state === uploadState.PENDING
  ) {
    return (
      <CurrentVideoProvider value={currentVideo}>
        <PictureInPictureProvider value={{ reversed: true }}>
          <JitsiApiProvider value={undefined}>
            <LiveModaleConfigurationProvider value={null}>
              <DashboardLive />
            </LiveModaleConfigurationProvider>
          </JitsiApiProvider>
        </PictureInPictureProvider>
      </CurrentVideoProvider>
    );
  }

  return (
    <CurrentVideoProvider value={currentVideo}>
      <DashboardVOD />
    </CurrentVideoProvider>
  );
};
