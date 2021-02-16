import React from 'react';

import { useVideo } from '../../data/stores/useVideo';
import { UploadState, Video } from '../../types/tracks';
import { DashboardTimedTextPane } from '../DashboardTimedTextPane';
import { DashboardVideoPane } from '../DashboardVideoPane';

interface DashboardVideoProps {
  video: Video;
}

const DashboardVideo = (props: DashboardVideoProps) => {
  const video = useVideo((state) => state.getVideo(props.video));
  const displayTimedTextPane =
    video.live_state === null &&
    ![
      UploadState.DELETED,
      UploadState.HARVESTED,
      UploadState.HARVESTING,
    ].includes(video.upload_state);

  return (
    <React.Fragment>
      <DashboardVideoPane video={video} />
      {displayTimedTextPane && <DashboardTimedTextPane />}
    </React.Fragment>
  );
};

export default DashboardVideo;
