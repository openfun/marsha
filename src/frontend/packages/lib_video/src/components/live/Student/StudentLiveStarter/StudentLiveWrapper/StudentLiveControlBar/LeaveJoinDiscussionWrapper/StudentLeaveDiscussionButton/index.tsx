/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Button, JoinDiscussionSVG } from 'lib-components';
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
      label={intl.formatMessage(messages.leaveDiscussion)}
      Icon={JoinDiscussionSVG}
      onClick={leaveDiscussion}
      reversed
      title={intl.formatMessage(messages.leaveDiscussion)}
    />
  );
};
