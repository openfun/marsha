import { Box, Text } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { DashboardJoinDiscussionAcceptButton } from '../DashboardJoinDiscussionAcceptButton';
import { DashboardJoinDiscussionRejectButton } from '../DashboardJoinDiscussionRejectButton';
import { DashboardJoinDiscussionKickButton } from '../DashboardJoinDiscussionKickButton';
import { useJoinParticipant } from '../../data/stores/useJoinParticipant';

const messages = defineMessages({
  participantAsking: {
    defaultMessage: 'is asking to join the discussion.',
    description:
      'Message to inform the instructor that a participant is asking to join the discussion',
    id: 'components.DashboardJoinDiscussion.participantAsking',
  },
  participantInDiscussion: {
    defaultMessage: 'has joined the discussion.',
    description:
      'Message to inform the instructor that a participant has joined the discussion',
    id: 'components.DashboardJoinDiscussion.participantInDiscussion',
  },
});

export const DashboardJoinDiscussion = () => {
  const { participantsAskingToJoin, participantsInDiscussion } =
    useJoinParticipant((state) => ({
      participantsAskingToJoin: state.participantsAskingToJoin,
      participantsInDiscussion: state.participantsInDiscussion,
    }));

  return (
    <Box direction="column" margin="small">
      {participantsAskingToJoin.map((participant) => (
        <Box
          direction="row"
          align="center"
          margin="small"
          key={`${participant.id}`}
          data-testid={`ask-${participant.id}`}
        >
          <Text weight="bold" margin="small">
            {participant.name}{' '}
          </Text>
          <FormattedMessage {...messages.participantAsking} />
          <DashboardJoinDiscussionAcceptButton participant={participant} />
          <DashboardJoinDiscussionRejectButton participant={participant} />
        </Box>
      ))}
      {participantsInDiscussion.map((participant) => (
        <Box
          direction="row"
          align="center"
          margin="small"
          key={`${participant.id}`}
          data-testid={`in-${participant.id}`}
        >
          <Text weight="bold" margin="small">
            {participant.name}{' '}
          </Text>
          <FormattedMessage {...messages.participantInDiscussion} />
          <DashboardJoinDiscussionKickButton participant={participant} />
        </Box>
      ))}
    </Box>
  );
};
