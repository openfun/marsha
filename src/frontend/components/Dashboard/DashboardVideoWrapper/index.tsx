import React from 'react';
import { liveState, uploadState, Video } from 'types/tracks';

import { DashboardVideo } from 'components/DashboardVideo';
import { DashboardVideoLive } from 'components/DashboardVideoLive';
import { LTINav } from 'components/LTINav';
import { useVideo } from 'data/stores/useVideo';
import { initVideoWebsocket } from 'data/websocket';
import { PictureInPictureProvider } from 'data/stores/usePictureInPicture';
import { JitsiApiProvider } from 'data/stores/useJitsiApi';
import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';
import { CurrentVideoProvider } from 'data/stores/useCurrentRessource/useCurrentVideo';

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
              <DashboardVideoLive />
            </LiveModaleConfigurationProvider>
          </JitsiApiProvider>
        </PictureInPictureProvider>
      </CurrentVideoProvider>
    );
  }

  return (
    <CurrentVideoProvider value={currentVideo}>
      <LTINav object={currentVideo} />
      <DashboardVideo />
    </CurrentVideoProvider>
  );
};
