import { Button } from '@openfun/cunningham-react';
import { JoinDiscussionSVG } from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';
import { converse } from '@lib-video/utils/window';

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
      icon={<JoinDiscussionSVG iconColor="white" width="30" />}
      aria-label={intl.formatMessage(messages.leaveDiscussion)}
      onClick={leaveDiscussion}
      title={intl.formatMessage(messages.leaveDiscussion)}
    >
      {intl.formatMessage(messages.leaveDiscussion)}
    </Button>
  );
};
