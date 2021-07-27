import { Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { Participant } from '../../types/Participant';
import { converse } from '../../utils/window';

const messages = defineMessages({
  kickParticipant: {
    defaultMessage: 'kick out participant',
    description: 'Kick the participant out of the discussion',
    id: 'components.DashboardJoinDiscussionKickButton.kickParticipant',
  },
});

interface DashboardJoinDiscussionKickButtonProps {
  participant: Participant;
}

export const DashboardJoinDiscussionKickButton = ({
  participant,
}: DashboardJoinDiscussionKickButtonProps) => {
  const removeParticipantInDiscussion = useJoinParticipant(
    (state) => state.removeParticipantInDiscussion,
  );

  const onClick = () => {
    converse.kickParticipant(participant);
    removeParticipantInDiscussion(participant);
  };

  return (
    <Button
      label={<FormattedMessage {...messages.kickParticipant} />}
      primary={true}
      onClick={onClick}
      margin="small"
      size="small"
    />
  );
};
