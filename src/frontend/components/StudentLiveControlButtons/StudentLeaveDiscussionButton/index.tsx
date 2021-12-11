import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { converse } from 'utils/window';
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

export const StudentLeaveDiscussionButton = () => {
  const reset = useParticipantWorkflow((state) => state.reset);
  const intl = useIntl();

  const leaveDiscussion = () => {
    converse.participantLeaves();
    reset();
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
};
