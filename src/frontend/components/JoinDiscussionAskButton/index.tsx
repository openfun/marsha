import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';
import { DashboardButton } from '../DashboardPaneButtons/DashboardButtons';

import { converse } from '../../utils/window';
import { PUBLIC_JITSI_ROUTE } from '../PublicVideoLiveJitsi/route';

const messages = defineMessages({
  askInstructor: {
    defaultMessage: 'Send request to join the discussion',
    description: 'Ask the instructor to join the discussion',
    id: 'components.JoinDiscussionAskButton.askInstructor',
  },
  waitingInstructor: {
    defaultMessage: "Waiting for Instructor's response",
    description: `Text that replace the JoinDiscussion button before the instructor response.`,
    id: 'components.JoinDiscussionAskButton.waitingInstructor',
  },
  rejected: {
    defaultMessage:
      'Your request to join the discussion has not been accepted.',
    description: 'Text to tell participant his/her request is not accepted',
    id: 'components.JoinDiscussionAskButton.rejected',
  },
});

export const JoinDiscussionAskButton = () => {
  const { asked, accepted, rejected, setAsked } = useParticipantWorkflow(
    (state) => ({
      asked: state.asked,
      accepted: state.accepted,
      rejected: state.rejected,
      setAsked: state.setAsked,
    }),
  );

  const onClick = () => {
    converse.askParticipantToJoin();
    setAsked();
  };

  if (accepted) {
    return <Redirect to={PUBLIC_JITSI_ROUTE()} />;
  }

  if (rejected) {
    return <FormattedMessage {...messages.rejected} />;
  }

  return asked ? (
    <FormattedMessage {...messages.waitingInstructor} />
  ) : (
    <DashboardButton
      label={<FormattedMessage {...messages.askInstructor} />}
      primary={true}
      onClick={onClick}
    />
  );
};
