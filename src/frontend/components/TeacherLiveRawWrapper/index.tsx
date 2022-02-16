import React from 'react';

import DashboardVideoLiveRaw from 'components/DashboardVideoLiveRaw';
import VideoPlayer from 'components/VideoPlayer';
import { useLiveFeedback } from 'data/stores/useLiveFeedback';
import { Video } from 'types/tracks';

interface TeacherLiveRawWrapperProps {
  video: Video;
}

const TeacherLiveRawWrapper = ({ video }: TeacherLiveRawWrapperProps) => {
  const [isDisplayLiveFeedback] = useLiveFeedback();

  if (isDisplayLiveFeedback) {
    return (
      <VideoPlayer
        defaultVolume={0}
        video={video}
        playerType="videojs"
        timedTextTracks={[]}
      />
    );
  } else {
    return <DashboardVideoLiveRaw video={video} />;
  }
};

export default TeacherLiveRawWrapper;
