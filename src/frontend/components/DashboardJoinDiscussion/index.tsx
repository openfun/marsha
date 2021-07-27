import { Box, Text } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { DashboardJoinDiscussionAcceptButton } from '../DashboardJoinDiscussionAcceptButton';
import { DashboardJoinDiscussionRejectButton } from '../DashboardJoinDiscussionRejectButton';
import { DashboardJoinDiscussionKickButton } from '../DashboardJoinDiscussionKickButton';
import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { Participant } from '../../types/Participant';

const messages = defineMessages({
  participantAsking: {
    defaultMessage: 'is asking to join the discussion.',
    description:
      'Message to inform the instructor that a student ask to join the discussion',
    id: 'components.DashboardJoinDiscussion.participantAsking',
  },
  participantInDiscussion: {
    defaultMessage: 'is in the discussion.',
    description:
      'Message to inform the instructor that a student ask to join the discussion',
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
      {participantsAskingToJoin.map((participant: Participant) => {
        return (
          <Box
            direction="row"
            align="center"
            margin="small"
            key={`${participant.id}`}
            data-testid={`ask-${participant.id}`}
          >
            <Text style={{ fontWeight: 'bold', margin: '5px' }}>
              {participant.name}{' '}
            </Text>
            <FormattedMessage {...messages.participantAsking} />
            <DashboardJoinDiscussionAcceptButton participant={participant} />
            <DashboardJoinDiscussionRejectButton participant={participant} />
          </Box>
        );
      })}
      {participantsInDiscussion.map((participant: Participant) => {
        return (
          <Box
            direction="row"
            align="center"
            margin="small"
            key={`${participant.id}`}
            data-testid={`in-${participant.id}`}
          >
            <Text style={{ fontWeight: 'bold', margin: '5px' }}>
              {participant.name}{' '}
            </Text>
            <FormattedMessage {...messages.participantInDiscussion} />
            <DashboardJoinDiscussionKickButton participant={participant} />
          </Box>
        );
      })}
    </Box>
  );
};
