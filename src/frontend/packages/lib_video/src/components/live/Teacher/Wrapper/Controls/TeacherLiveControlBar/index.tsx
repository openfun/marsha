import { Box } from 'grommet';
import { LiveModeType, liveState } from 'lib-components';
import React, { useEffect } from 'react';

import { pollForLive } from '@lib-video/api/pollForLive';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import { useLiveStateStarted } from '@lib-video/hooks/useLiveStateStarted';

import { LiveFeedbackWrapper } from './LiveFeedbackWrapper';

export const TeacherLiveControlBar = () => {
  const video = useCurrentVideo();
  const { isStarted, setIsStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
    setIsStarted: state.setIsStarted,
  }));

  useEffect(() => {
    let canceled = false;
    const poll = async () => {
      if (
        isStarted ||
        video.live_type !== LiveModeType.RAW ||
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

      setIsStarted(true);
    };

    poll();
    return () => {
      canceled = true;
    };
  }, [video, isStarted, setIsStarted]);

  if (!(video.live_type === LiveModeType.RAW && isStarted)) {
    return null;
  }

  return (
    <Box direction="row" height="100%">
      <Box height="100%" style={{ minWidth: '60px' }}>
        <LiveFeedbackWrapper />
      </Box>
    </Box>
  );
};
