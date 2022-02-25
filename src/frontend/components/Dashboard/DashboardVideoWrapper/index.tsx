import React, { Fragment } from 'react';
import { uploadState, Video } from 'types/tracks';

import DashboardVideo from 'components/DashboardVideo';
import { DashboardVideoLive } from 'components/DashboardVideoLive';
import { LTINav } from 'components/LTINav';
import { useVideo } from 'data/stores/useVideo';
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
    currentVideo.live_state &&
    currentVideo.upload_state === uploadState.PENDING
  ) {
    return <DashboardVideoLive video={currentVideo} />;
  }

  return (
    <Fragment>
      <LTINav object={currentVideo} />
      <DashboardVideo video={currentVideo} />
    </Fragment>
  );
};
