import { Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

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
  const onClick = () => {
    converse.kickParticipant(participant);
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
