import React, { useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';

import { AppsWrapper } from 'components/LiveControls/AppsWrapper';
import { ChatWrapper } from 'components/LiveControls/ChatWrapper';
import { ViewersWrapper } from 'components/LiveControls/ViewersWrapper';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { LiveModeType, liveState, Video } from 'types/tracks';

import { LeaveJoinDiscussionWrapper } from './LeaveJoinDiscussionWrapper';

interface StudentLiveControlBarProps {
  video: Video;
}

export const StudentLiveControlBar = ({
  video,
}: StudentLiveControlBarProps) => {
  const size = useContext(ResponsiveContext);
  const { availableItems } = useLivePanelState((state) => ({
    availableItems: state.availableItems,
  }));

  const displayJoinDiscussionButtons =
    video.xmpp &&
    video.live_type === LiveModeType.JITSI &&
    video.live_state &&
    ![liveState.STOPPING, liveState.PAUSED, liveState.STARTING].includes(
      video.live_state,
    );

  return (
    <Box
      direction="row-reverse"
      flex
      height="100%"
      justify={size === 'small' ? 'evenly' : undefined}
    >
      {availableItems.includes(LivePanelItem.APPLICATION) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <AppsWrapper />
        </Box>
      )}

      {availableItems.includes(LivePanelItem.VIEWERS_LIST) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <ViewersWrapper />
        </Box>
      )}

      {availableItems.includes(LivePanelItem.CHAT) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <ChatWrapper />
        </Box>
      )}

      {displayJoinDiscussionButtons && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <LeaveJoinDiscussionWrapper />
        </Box>
      )}
    </Box>
  );
};
