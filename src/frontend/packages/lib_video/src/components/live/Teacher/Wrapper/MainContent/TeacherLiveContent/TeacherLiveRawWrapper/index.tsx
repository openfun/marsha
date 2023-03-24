import { Video } from 'lib-components';
import React from 'react';

import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';
import DashboardLiveRaw from '@lib-video/components/live/common/DashboardLiveRaw';
import { useLiveFeedback } from '@lib-video/hooks/useLiveFeedback';

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
    return <DashboardLiveRaw video={video} />;
  }
};

export default TeacherLiveRawWrapper;
