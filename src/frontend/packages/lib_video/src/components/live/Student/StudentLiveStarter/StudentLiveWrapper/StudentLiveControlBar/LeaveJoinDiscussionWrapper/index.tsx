import { Loader } from '@openfun/cunningham-react';
import { Text } from 'lib-components';
import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';

import { StudentJoinDiscussionButton } from './StudentJoinDiscussionButton';
import { StudentLeaveDiscussionButton } from './StudentLeaveDiscussionButton';

const messages = defineMessages({
  waitingInstructor: {
    defaultMessage: "Waiting for Instructor's response",
    description: `Text that replace the JoinDiscussion button before the instructor response.`,
    id: 'components.StudentJoinDiscussionButton.waitingInstructor',
  },
  rejected: {
    defaultMessage:
      'Your request to join the discussion has not been accepted.',
    description: 'Text to tell participant his/her request is not accepted',
    id: 'components.StudentJoinDiscussionButton.rejected',
  },
});

export const LeaveJoinDiscussionWrapper = () => {
  const intl = useIntl();
  const { asked, accepted, rejected, reset } = useParticipantWorkflow(
    (state) => ({
      asked: state.asked,
      accepted: state.accepted,
      rejected: state.rejected,
      reset: state.reset,
    }),
  );

  //  if user is rejected : alert user and reset state
  useEffect(() => {
    if (rejected) {
      reset();
      toast.error(intl.formatMessage(messages.rejected));
    }
  }, [intl, rejected, reset]);

  if (asked) {
    return (
      <Text
        type="div"
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <Loader size="small" />
        {intl.formatMessage(messages.waitingInstructor)}
      </Text>
    );
  } else if (accepted) {
    return <StudentLeaveDiscussionButton />;
  } else {
    return <StudentJoinDiscussionButton />;
  }
};
