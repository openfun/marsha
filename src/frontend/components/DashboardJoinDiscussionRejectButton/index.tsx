import { Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { Participant } from '../../types/Participant';
import { converse } from '../../utils/window';

const messages = defineMessages({
  rejectParticipant: {
    defaultMessage: 'reject',
    description: 'Reject the participant who requests to join the discussion',
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
    converse.rejectParticipantToJoin(participant);
  };

  return (
    <Button
      label={<FormattedMessage {...messages.rejectParticipant} />}
      onClick={onClick}
      margin="small"
      size="small"
    />
  );
};
