import React, { Fragment } from 'react';
import { uploadState, Video } from 'types/tracks';

import DashboardVideo from 'components/DashboardVideo';
import { DashboardVideoLive } from 'components/DashboardVideoLive';
import { LTINav } from 'components/LTINav';
import { useVideo } from 'data/stores/useVideo';
import { initVideoWebsocket } from 'data/websocket';
import { PictureInPictureProvider } from 'data/stores/usePictureInPicture';
import { JitsiApiProvider } from 'data/stores/useJitsiApi';
import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';

interface DashboardVideoWrapperProps {
  video: Video;
}

export const DashboardVideoWrapper = ({
  video,
}: DashboardVideoWrapperProps) => {
  const currentVideo = useVideo((state) => state.getVideo(video));
  initVideoWebsocket(currentVideo);

  if (
    currentVideo.live_state &&
    currentVideo.upload_state === uploadState.PENDING
  ) {
    return (
      <PictureInPictureProvider value={{ reversed: true }}>
        <JitsiApiProvider value={undefined}>
          <LiveModaleConfigurationProvider value={null}>
            <DashboardVideoLive video={currentVideo} />
          </LiveModaleConfigurationProvider>
        </JitsiApiProvider>
      </PictureInPictureProvider>
    );
  }

  return (
    <Fragment>
      <LTINav object={currentVideo} />
      <DashboardVideo video={currentVideo} />
    </Fragment>
  );
};
