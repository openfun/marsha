import React, { useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { LiveModeType, liveState, Video } from 'types/tracks';

import { AppsWrapper } from './AppsWrapper';
import { ChatWrapper } from './ChatWrapper';
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
    ![liveState.STOPPING, liveState.PAUSED].includes(video.live_state);

  return (
    <Box
      height="100%"
      style={{
        flex: '1',
        flexDirection: 'row-reverse',
        justifyContent: size === 'small' ? 'space-evenly' : 'initial',
      }}
    >
      {availableItems.includes(LivePanelItem.APPLICATION) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <AppsWrapper />
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
