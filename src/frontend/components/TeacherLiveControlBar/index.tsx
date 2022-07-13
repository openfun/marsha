import { Box } from 'grommet';
import React, { useEffect } from 'react';

import { ChatWrapper } from 'components/LiveControls/ChatWrapper';
import { ViewersWrapper } from 'components/LiveControls/ViewersWrapper';
import { pollForLive } from 'data/sideEffects/pollForLive';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { LiveModeType, liveState } from 'types/tracks';

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
  }, [video, isStarted]);

  return (
    <Box direction="row" height="100%">
      {availableItems.includes(LivePanelItem.CHAT) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <ChatWrapper />
        </Box>
      )}

      {availableItems.includes(LivePanelItem.VIEWERS_LIST) && (
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
