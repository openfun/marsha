import { Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { Participant } from '../../types/Participant';
import { converse } from '../../utils/window';

const messages = defineMessages({
  kickParticipant: {
    defaultMessage: 'kick off participant',
    description: 'Kick the participant of the discussion',
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
      style={{ width: '100px !important', margin: '10px' }}
    />
  );
};
