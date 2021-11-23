import React from 'react';
import styled from 'styled-components';
import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';

import { theme } from 'utils/theme/theme';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';

import { StudentJoinDiscussionButton } from './StudentJoinDiscussionButton';
import { StudentLeaveDiscussionButton } from './StudentLeaveDiscussionButton';
import { StudentViewDocumentButton } from './StudentViewDocumentButton';
import { StudentShowViewersButton } from './StudentShowViewersButton';
import { StudentShowChatButton } from './StudentShowChatButton';
import { StudentShowAppsButton } from './StudentShowAppsButton';
import { StudentShowSpeakerButton } from './StudentShowSpeakerButton';

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

export const LiveControlButtons = () => {
  const accepted = useParticipantWorkflow((state) => state.accepted);

  return (
    <LiveButtonsWrapper direction="row" align="center" responsive={true}>
      {accepted ? (
        <Box margin={{ right: 'medium' }}>
          <StudentLeaveDiscussionButton />
        </Box>
      ) : (
        <Box margin={{ right: 'medium' }}>
          <StudentJoinDiscussionButton />
        </Box>
      )}

      <Box direction="row" margin={{ left: 'medium', right: 'medium' }}>
        <StudentShowSpeakerButton />
        <StudentViewDocumentButton />
      </Box>

      <Box direction="row" margin={{ left: 'medium' }}>
        <StudentShowChatButton />
        <StudentShowViewersButton />
      </Box>

      <Box direction="row" margin={{ left: 'small' }}>
        <StudentShowAppsButton />
      </Box>
    </LiveButtonsWrapper>
  );
};
