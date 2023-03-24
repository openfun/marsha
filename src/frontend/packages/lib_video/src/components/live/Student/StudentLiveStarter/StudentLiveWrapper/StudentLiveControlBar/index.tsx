import { Box, ResponsiveContext } from 'grommet';
import { JoinMode, LiveModeType, liveState } from 'lib-components';
import React, { useContext } from 'react';

import { AppsWrapper } from '@lib-video/components/live/common/LiveControls/AppsWrapper';
import { ChatWrapper } from '@lib-video/components/live/common/LiveControls/ChatWrapper';
import { ViewersWrapper } from '@lib-video/components/live/common/LiveControls/ViewersWrapper';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { LeaveJoinDiscussionWrapper } from './LeaveJoinDiscussionWrapper';

export const StudentLiveControlBar = () => {
  const live = useCurrentLive();
  const isMobileView = useContext(ResponsiveContext) === 'small';
  const { availableItems } = useLivePanelState((state) => ({
    availableItems: state.availableItems,
  }));

  const displayJoinDiscussionButtons =
    live.xmpp &&
    live.live_type === LiveModeType.JITSI &&
    live.live_state &&
    live.live_state === liveState.RUNNING &&
    live.join_mode === JoinMode.APPROVAL;

  return (
    <Box
      direction="row-reverse"
      height="100%"
      justify={isMobileView ? 'evenly' : undefined}
    >
      {isMobileView && availableItems.includes(LivePanelItem.APPLICATION) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <AppsWrapper />
        </Box>
      )}

      {isMobileView && availableItems.includes(LivePanelItem.VIEWERS_LIST) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <ViewersWrapper />
        </Box>
      )}

      {isMobileView && availableItems.includes(LivePanelItem.CHAT) && (
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
