import { Button } from 'grommet';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Participant } from '../../types/Participant';
import { Video } from '../../types/tracks';
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
  video: Video;
}

export const DashboardJoinDiscussionAcceptButton = ({
  participant,
  video,
}: DashboardJoinDiscussionAcceptButtonProps) => {
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
