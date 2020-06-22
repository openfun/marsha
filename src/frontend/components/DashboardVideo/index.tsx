import React from 'react';

import { useVideo } from '../../data/stores/useVideo';
import { Video } from '../../types/tracks';
import { DashboardTimedTextPane } from '../DashboardTimedTextPane';
import { DashboardVideoPane } from '../DashboardVideoPane';

interface DashboardVideoProps {
  video: Video;
}

const DashboardVideo = (props: DashboardVideoProps) => {
  const video = useVideo((state) => state.getVideo(props.video));

  return (
    <React.Fragment>
      <DashboardVideoPane video={video} />
      {video.live_state === null && <DashboardTimedTextPane />}
    </React.Fragment>
  );
};

export default DashboardVideo;
