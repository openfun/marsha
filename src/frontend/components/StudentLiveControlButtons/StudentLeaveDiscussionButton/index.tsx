import React from 'react';
import { withRouter } from 'react-router';
import { defineMessages, useIntl } from 'react-intl';

import { converse } from 'utils/window';
import { PLAYER_ROUTE } from 'components/routes';
import { modelName } from 'types/models';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { JoinDiscussionSVG } from 'components/SVGIcons/JoinDiscussionSVG';
import { Button } from 'components/Button';

const messages = defineMessages({
  leaveDiscussion: {
    defaultMessage: 'Leave discussion',
    description: 'Title for the leave discussion button',
    id: 'components.StudentLeaveDiscussionButton.leaveDiscussion',
  },
});

export const StudentLeaveDiscussionButton = withRouter(({ history }) => {
  const reset = useParticipantWorkflow((state) => state.reset);
  const intl = useIntl();

  const leaveDiscussion = () => {
    converse.participantLeaves();
    reset();
    history.push(PLAYER_ROUTE(modelName.VIDEOS));
  };

  return (
    <Button
      label={intl.formatMessage(messages.leaveDiscussion)}
      Icon={JoinDiscussionSVG}
      onClick={leaveDiscussion}
      reversed
      title={intl.formatMessage(messages.leaveDiscussion)}
    />
  );
});
