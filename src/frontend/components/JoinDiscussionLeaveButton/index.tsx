import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';

import { DashboardButton } from '../DashboardPaneButtons/DashboardButtons';
import { converse } from '../../utils/window';
import { PLAYER_ROUTE } from '../routes';
import { modelName } from '../../types/models';
import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';

const messages = defineMessages({
  leaveDiscussion: {
    defaultMessage: 'Leave the discussion',
    description: 'Leave the discussion',
    id: 'components.JoinDiscussionLeaveButton.leaveDiscussion',
  },
});

export const JoinDiscussionLeaveButton = () => {
  const navigate = useNavigate();
  const reset = useParticipantWorkflow((state) => state.reset);

  const onClick = () => {
    converse.participantLeaves();
    reset();
    navigate(PLAYER_ROUTE(modelName.VIDEOS));
  };

  return (
    <DashboardButton
      label={<FormattedMessage {...messages.leaveDiscussion} />}
      primary={true}
      onClick={onClick}
    />
  );
};
