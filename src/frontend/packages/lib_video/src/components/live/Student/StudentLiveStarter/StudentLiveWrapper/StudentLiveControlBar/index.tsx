import { Box } from 'grommet';
import {
  JoinMode,
  LiveModeType,
  liveState,
  useResponsive,
} from 'lib-components';
import styled from 'styled-components';

import { AppsWrapper } from '@lib-video/components/live/common/LiveControls/AppsWrapper';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { LeaveJoinDiscussionWrapper } from './LeaveJoinDiscussionWrapper';

const ButtonBox = styled(Box)`
  & > button > div {
    height: 45px;
  }
`;

export const StudentLiveControlBar = () => {
  const live = useCurrentLive();
  const { isMobile } = useResponsive();
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
      justify={isMobile ? 'evenly' : undefined}
    >
      {isMobile && availableItems.includes(LivePanelItem.APPLICATION) && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <AppsWrapper />
        </Box>
      )}

      {displayJoinDiscussionButtons && (
        <Box height="100%" style={{ minWidth: '60px' }}>
          <ButtonBox>
            <LeaveJoinDiscussionWrapper />
          </ButtonBox>
        </Box>
      )}
    </Box>
  );
};
