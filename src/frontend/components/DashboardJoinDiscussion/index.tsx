import { Box, Text } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { DashboardJoinDiscussionAcceptButton } from 'components/DashboardJoinDiscussionAcceptButton';
import { DashboardJoinDiscussionRejectButton } from 'components/DashboardJoinDiscussionRejectButton';
import { DashboardJoinDiscussionKickButton } from 'components/DashboardJoinDiscussionKickButton';
import { Video } from 'types/tracks';

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

interface DashboardJoinDiscussionProps {
  video: Video;
}

export const DashboardJoinDiscussion = ({
  video,
}: DashboardJoinDiscussionProps) => (
  <Box direction="column" margin="small">
    {video.participants_asking_to_join?.map((participant) => (
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
        <DashboardJoinDiscussionAcceptButton
          participant={participant}
          video={video}
        />
        <DashboardJoinDiscussionRejectButton participant={participant} />
      </Box>
    ))}
    {video.participants_in_discussion?.map((participant) => (
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
