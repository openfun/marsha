import { Box, ResponsiveContext } from 'grommet';
import { LiveModeType, liveState } from 'lib-components';
import React, { useContext, useEffect } from 'react';

import { pollForLive } from '@lib-video/api/pollForLive';
import { ChatWrapper } from '@lib-video/components/live/common/LiveControls/ChatWrapper';
import { ViewersWrapper } from '@lib-video/components/live/common/LiveControls/ViewersWrapper';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { useLiveStateStarted } from '@lib-video/hooks/useLiveStateStarted';

import { LiveFeedbackWrapper } from './LiveFeedbackWrapper';

export const TeacherLiveControlBar = () => {
  const video = useCurrentVideo();
  const { isStarted, setIsStarted } = useLiveStateStarted((state) => ({
    isStarted: state.isStarted,
    setIsStarted: state.setIsStarted,
  }));
  const { availableItems } = useLivePanelState((state) => ({
    availableItems: state.availableItems,
  }));
  const isMobileView = useContext(ResponsiveContext) === 'small';

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

  return (
    <Box direction="row" height="100%">
      {isMobileView && availableItems.includes(LivePanelItem.CHAT) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <ChatWrapper />
        </Box>
      )}

      {isMobileView && availableItems.includes(LivePanelItem.VIEWERS_LIST) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <ViewersWrapper />
        </Box>
      )}

      {video.live_type === LiveModeType.RAW && isStarted && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <LiveFeedbackWrapper />
        </Box>
      )}
    </Box>
  );
};
