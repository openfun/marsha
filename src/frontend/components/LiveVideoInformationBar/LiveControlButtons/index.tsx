import React from 'react';
import styled from 'styled-components';
import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';

import {
  LivePanelDetail,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { theme } from 'utils/theme/theme';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';

import { StudentJoinDiscussionButton } from './StudentJoinDiscussionButton';
import { StudentLeaveDiscussionButton } from './StudentLeaveDiscussionButton';
import { StudentShareDocButton } from './StudentShareDocButton';
import { StudentShowViewersButton } from './StudentShowViewersButton';
import { StudentShowChatButton } from './StudentShowChatButton';
import { LiveModeType, liveState, Video } from 'types/tracks';

const LiveButtonsWrapper = styled(Box)`
  div {
    position: relative;

    span {
      position: absolute;
      bottom: -2px;
      right: 0px;
      background-color: ${normalizeColor('status-warning', theme)};
      border-radius: 8px;
      color: ${normalizeColor('white', theme)};
      font-size: 0.6em;
      padding: 0 8px;
      border: 2px solid ${normalizeColor('white', theme)};
    }
  }
`;

interface LiveControlButtonsProps {
  video: Video;
}

export const LiveControlButtons = ({ video }: LiveControlButtonsProps) => {
  const accepted = useParticipantWorkflow((state) => state.accepted);
  const isChatAvailable = useLivePanelState((state) =>
    state.availableDetails.includes(LivePanelDetail.CHAT),
  );
  const displayJoinDiscussionButtons =
    video.xmpp &&
    video.live_type === LiveModeType.JITSI &&
    video.live_state &&
    ![liveState.STOPPING, liveState.PAUSED].includes(video.live_state);

  return (
    <LiveButtonsWrapper direction="row" align="center" responsive={true}>
      <StudentShareDocButton />

      <StudentShowViewersButton />

      {isChatAvailable && <StudentShowChatButton />}

      {displayJoinDiscussionButtons &&
        (accepted ? (
          <StudentLeaveDiscussionButton />
        ) : (
          <StudentJoinDiscussionButton />
        ))}
    </LiveButtonsWrapper>
  );
};
