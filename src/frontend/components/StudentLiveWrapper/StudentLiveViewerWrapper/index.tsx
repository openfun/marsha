import React, { useEffect } from 'react';

import { StudentLiveAdvertising } from 'components/StudentLiveAdvertising';
import VideoPlayer from 'components/VideoPlayer';
import { pollForLive } from 'data/sideEffects/pollForLive';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { liveState, Video } from 'types/tracks';

interface StudentLiveViewerWrapperProps {
  video: Video;
  playerType: string;
}

export const StudentLiveViewerWrapper = ({
  video,
  playerType,
}: StudentLiveViewerWrapperProps) => {
  const { isLiveStarted, setIsLiveStarted } = useLiveStateStarted((state) => ({
    isLiveStarted: state.isStarted,
    setIsLiveStarted: state.setIsStarted,
  }));

  useEffect(() => {
    let canceled = false;
    const poll = async () => {
      if (
        isLiveStarted ||
        !video.urls ||
        !video.live_state ||
        [liveState.IDLE, liveState.STARTING].includes(video.live_state)
      ) {
        return;
      }

      await pollForLive(video.urls);
      if (canceled) {
        return;
      }

      setIsLiveStarted(true);
    };

    poll();
    return () => {
      canceled = true;
    };
  }, [video, isLiveStarted]);

  if (!isLiveStarted) {
    return <StudentLiveAdvertising video={video} />;
  } else {
    return (
      <VideoPlayer playerType={playerType} timedTextTracks={[]} video={video} />
    );
  }
};
