import { Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { useJoinParticipant } from '../../data/stores/useJoinParticipant';
import { Participant } from '../../types/Participant';
import { converse } from '../../utils/window';

const messages = defineMessages({
  acceptParticipant: {
    defaultMessage: 'accept',
    description: 'Accept the participant in the discussion',
    id: 'components.DashboardJoinDiscussionAcceptButton.acceptParticipant',
  },
});

interface DashboardJoinDiscussionAcceptButtonProps {
  participant: Participant;
}

export const DashboardJoinDiscussionAcceptButton = ({
  participant,
}: DashboardJoinDiscussionAcceptButtonProps) => {
  const moveParticipantToDiscussion = useJoinParticipant(
    (state) => state.moveParticipantToDiscussion,
  );

  const onClick = () => {
    converse.acceptParticipantToJoin(participant, video);
  };

  return (
    <Button
      label={<FormattedMessage {...messages.acceptParticipant} />}
      primary={true}
      onClick={onClick}
      margin="small"
      size="small"
    />
  );
};
