import { Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { Participant } from '../../types/Participant';
import { converse } from '../../utils/window';

const messages = defineMessages({
  rejectParticipant: {
    defaultMessage: 'reject',
    description: 'Reject the participant of the discussion',
    id: 'components.DashboardJoinDiscussionRejectButton.rejectParticipant',
  },
});

interface DashboardJoinDiscussionRejectButtonProps {
  participant: Participant;
}

export const DashboardJoinDiscussionRejectButton = ({
  participant,
}: DashboardJoinDiscussionRejectButtonProps) => {
  const removeParticipantAskingToJoin = useJoinParticipant(
    (state) => state.removeParticipantAskingToJoin,
  );

  const onClick = () => {
    converse.rejectParticipantToMount(participant);
    removeParticipantAskingToJoin(participant);
  };

  return (
    <Button
      label={<FormattedMessage {...messages.rejectParticipant} />}
      onClick={onClick}
      style={{ width: '100px !important', margin: '10px' }}
    />
  );
};
