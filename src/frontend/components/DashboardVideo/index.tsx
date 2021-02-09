import React from 'react';

import { useVideo } from '../../data/stores/useVideo';
import { uploadState, Video } from '../../types/tracks';
import { DashboardTimedTextPane } from '../DashboardTimedTextPane';
import { DashboardVideoPane } from '../DashboardVideoPane';

const { READY, PENDING } = uploadState;

interface DashboardVideoProps {
  video: Video;
}

const DashboardVideo = (props: DashboardVideoProps) => {
  const video = useVideo((state) => state.getVideo(props.video));
  const displayTimedTextPane =
    video.live_state === null &&
    ![
      uploadState.DELETED,
      uploadState.HARVESTED,
      uploadState.HARVESTING,
    ].includes(video.upload_state);

  return (
    <React.Fragment>
      <DashboardVideoPane video={video} />
      {displayTimedTextPane && <DashboardTimedTextPane />}
    </React.Fragment>
  );
};

export default DashboardVideo;
